import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, '../..');

let processo;
let base;
let pasta;
let token;

before(async () => {
  pasta = mkdtempSync(join(tmpdir(), 'treino-teste-'));
  const banco = join(pasta, 'teste.db');

  // Cria o usuario de teste
  const criacao = spawn('node', [join(RAIZ, 'server/scripts/criar-usuario.js'), 'Teste', 'ficha-mae-2026-01'], {
    env: { ...process.env, BANCO: banco },
  });
  let saida = '';
  criacao.stdout.on('data', (d) => (saida += d));
  await new Promise((r) => criacao.on('close', r));
  token = saida.match(/Token: (\S+)/)[1];

  const porta = 3999;
  base = `http://127.0.0.1:${porta}`;
  processo = spawn('node', [join(RAIZ, 'server/src/server.js')], {
    env: { ...process.env, BANCO: banco, PORTA: String(porta), HOST: '127.0.0.1' },
  });
  processo.stderr.on('data', (d) => console.error('[servidor]', String(d)));

  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`${base}/api/saude`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error('servidor não subiu');
});

after(() => {
  processo?.kill();
  rmSync(pasta, { recursive: true, force: true });
});

const comToken = (caminho, opcoes = {}) =>
  fetch(`${base}${caminho}`, {
    ...opcoes,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...opcoes.headers },
  });

const registro = (extra = {}) => ({
  data: '2026-09-12',
  treinoId: 'A',
  fichaId: 'ficha-mae-2026-01',
  exercicioId: 'goblet-squat',
  indice: 0,
  feito: true,
  carga: '8',
  reps: '12',
  atualizadoEm: Date.now(),
  ...extra,
});

describe('autenticação', () => {
  test('recusa requisição sem token', async () => {
    const r = await fetch(`${base}/api/eu`);
    assert.equal(r.status, 401);
  });

  test('recusa token inválido', async () => {
    const r = await fetch(`${base}/api/eu`, { headers: { authorization: 'Bearer nao-existe' } });
    assert.equal(r.status, 401);
  });

  test('aceita token válido e devolve a ficha ativa', async () => {
    const r = await comToken('/api/eu');
    assert.equal(r.status, 200);
    const corpo = await r.json();
    assert.equal(corpo.nome, 'Teste');
    assert.equal(corpo.fichaAtiva, 'ficha-mae-2026-01');
  });

  test('aceita token via ?k= na URL', async () => {
    const r = await fetch(`${base}/api/eu?k=${token}`);
    assert.equal(r.status, 200);
  });
});

describe('gravação de séries', () => {
  test('grava e devolve a série', async () => {
    const r = await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro()] }),
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).gravados, 1);

    const { sessoes } = await (await comToken('/api/sessoes')).json();
    const serie = sessoes['2026-09-12|A'].exercicios['goblet-squat'].series[0];
    assert.deepEqual(
      { feito: serie.feito, carga: serie.carga, reps: serie.reps },
      { feito: true, carga: '8', reps: '12' },
    );
  });

  test('cria a sessão sozinha na primeira série (presença automática)', async () => {
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ data: '2026-09-14', treinoId: 'B', exercicioId: 'prancha' })] }),
    });
    const { sessoes } = await (await comToken('/api/sessoes')).json();
    assert.ok(sessoes['2026-09-14|B'], 'sessão deveria ter sido criada');
    assert.equal(sessoes['2026-09-14|B'].fichaId, 'ficha-mae-2026-01');
  });

  test('grava várias séries de uma vez (fila offline)', async () => {
    const lote = [0, 1, 2].map((i) => registro({ data: '2026-09-16', indice: i, carga: String(10 + i) }));
    const r = await comToken('/api/series', { method: 'POST', body: JSON.stringify({ registros: lote }) });
    assert.equal((await r.json()).gravados, 3);

    const { sessoes } = await (await comToken('/api/sessoes')).json();
    const series = sessoes['2026-09-16|A'].exercicios['goblet-squat'].series;
    assert.deepEqual(series.map((s) => s.carga), ['10', '11', '12']);
  });
});

describe('resolução de conflito', () => {
  test('gravação mais nova sobrescreve a mais antiga', async () => {
    const base_ = { data: '2026-09-18', exercicioId: 'leg-press-45' };
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ ...base_, carga: '20', atualizadoEm: 1000 })] }),
    });
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ ...base_, carga: '30', atualizadoEm: 2000 })] }),
    });
    const { sessoes } = await (await comToken('/api/sessoes')).json();
    assert.equal(sessoes['2026-09-18|A'].exercicios['leg-press-45'].series[0].carga, '30');
  });

  test('gravação antiga chegando atrasada NÃO sobrescreve a nova', async () => {
    const base_ = { data: '2026-09-20', exercicioId: 'remada-sentada' };
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ ...base_, carga: '30', atualizadoEm: 2000 })] }),
    });
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ ...base_, carga: '20', atualizadoEm: 1000 })] }),
    });
    const { sessoes } = await (await comToken('/api/sessoes')).json();
    assert.equal(sessoes['2026-09-20|A'].exercicios['remada-sentada'].series[0].carga, '30');
  });
});

describe('validação de entrada', () => {
  const invalidos = [
    ['data fora do formato', { data: '12/09/2026' }],
    ['exercicioId com caracteres estranhos', { exercicioId: '../../etc/passwd' }],
    ['índice negativo', { indice: -1 }],
    ['índice absurdo', { indice: 999 }],
    ['treinoId vazio', { treinoId: '' }],
  ];

  for (const [nome, campos] of invalidos) {
    test(`recusa ${nome}`, async () => {
      const r = await comToken('/api/series', {
        method: 'POST',
        body: JSON.stringify({ registros: [registro(campos)] }),
      });
      assert.equal(r.status, 400);
    });
  }

  test('recusa corpo sem a lista de registros', async () => {
    const r = await comToken('/api/series', { method: 'POST', body: JSON.stringify({ nada: true }) });
    assert.equal(r.status, 400);
  });

  test('recusa JSON malformado', async () => {
    const r = await comToken('/api/series', { method: 'POST', body: '{isso nao e json' });
    assert.equal(r.status, 400);
  });

  test('carga inválida vira vazio em vez de derrubar o servidor', async () => {
    const r = await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ data: '2026-09-22', carga: 'DROP TABLE series' })] }),
    });
    assert.equal(r.status, 200);
    const { sessoes } = await (await comToken('/api/sessoes')).json();
    assert.equal(sessoes['2026-09-22|A'].exercicios['goblet-squat'].series[0].carga, '');
  });

  test('carimbo do futuro é limitado a agora', async () => {
    const futuro = Date.now() + 1000 * 60 * 60 * 24 * 365;
    await comToken('/api/series', {
      method: 'POST',
      body: JSON.stringify({ registros: [registro({ data: '2026-09-24', atualizadoEm: futuro })] }),
    });
    const { sessoes } = await (await comToken('/api/sessoes')).json();
    assert.ok(sessoes['2026-09-24|A'].exercicios['goblet-squat'].series[0].atualizadoEm <= Date.now() + 1000);
  });
});

describe('isolamento entre usuários', () => {
  test('um usuário não enxerga as sessões do outro', async () => {
    const criacao = spawn('node', [join(RAIZ, 'server/scripts/criar-usuario.js'), 'Outro', 'ficha-mae-2026-01'], {
      env: { ...process.env, BANCO: join(pasta, 'teste.db') },
    });
    let saida = '';
    criacao.stdout.on('data', (d) => (saida += d));
    await new Promise((r) => criacao.on('close', r));
    const outroToken = saida.match(/Token: (\S+)/)[1];

    const r = await fetch(`${base}/api/sessoes`, { headers: { authorization: `Bearer ${outroToken}` } });
    const { sessoes } = await r.json();
    assert.equal(Object.keys(sessoes).length, 0, 'o outro usuário deveria ver zero sessões');
  });
});

describe('filtro e estáticos', () => {
  test('filtra por data com ?desde=', async () => {
    const { sessoes } = await (await comToken('/api/sessoes?desde=2026-09-20')).json();
    const datas = Object.keys(sessoes).map((c) => c.split('|')[0]);
    assert.ok(datas.length > 0);
    assert.ok(datas.every((d) => d >= '2026-09-20'), `datas fora do filtro: ${datas}`);
  });

  test('serve o index.html', async () => {
    const r = await fetch(`${base}/`);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /<title>Treino<\/title>/);
  });

  test('bloqueia path traversal nos estáticos', async () => {
    const r = await fetch(`${base}/../../etc/passwd`);
    assert.ok(r.status === 403 || r.status === 404, `esperado 403/404, veio ${r.status}`);
  });
});
