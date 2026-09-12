import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { abrirBanco, usuarioPorToken, salvarSeries, listarSessoes } from './db.js';
import { responderJson, erro, lerCorpoJson, extrairToken, servirEstatico } from './http.js';
import { validarRegistros, validarDesde } from './validacao.js';

const AQUI = dirname(fileURLToPath(import.meta.url));

const PORTA = Number(process.env.PORTA ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const CAMINHO_BD = process.env.BANCO ?? resolve(AQUI, '../../dados/treino.db');
// Em producao o nginx serve o estatico; aqui e' so para rodar standalone.
const RAIZ_PUBLICA = process.env.PUBLICO ? resolve(process.env.PUBLICO) : resolve(AQUI, '../../public');
const SERVIR_ESTATICO = process.env.SERVIR_ESTATICO !== 'false';

abrirBanco(CAMINHO_BD);

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const rota = url.pathname;

  try {
    if (rota === '/api/saude') {
      return responderJson(res, 200, { ok: true, agora: new Date().toISOString() });
    }

    if (rota.startsWith('/api/')) {
      return await rotasApi(req, res, url, rota);
    }

    if (SERVIR_ESTATICO && req.method === 'GET') {
      return servirEstatico(res, RAIZ_PUBLICA, rota);
    }

    return erro(res, 404, 'Não encontrado');
  } catch (e) {
    if (e?.status) return erro(res, e.status, e.message);
    console.error('Erro inesperado:', e);
    return erro(res, 500, 'Erro interno');
  }
});

async function rotasApi(req, res, url, rota) {
  const usuario = usuarioPorToken(extrairToken(req, url));
  if (!usuario) return erro(res, 401, 'Token inválido ou ausente');

  if (rota === '/api/eu' && req.method === 'GET') {
    return responderJson(res, 200, {
      id: usuario.id,
      nome: usuario.nome,
      fichaAtiva: usuario.ficha_ativa,
    });
  }

  if (rota === '/api/sessoes' && req.method === 'GET') {
    const desde = validarDesde(url.searchParams.get('desde'));
    return responderJson(res, 200, { sessoes: listarSessoes(usuario.id, desde) });
  }

  if (rota === '/api/series' && req.method === 'POST') {
    const registros = validarRegistros(await lerCorpoJson(req));
    const gravados = registros.length ? salvarSeries(usuario.id, registros) : 0;
    return responderJson(res, 200, { gravados });
  }

  return erro(res, 404, 'Rota não encontrada');
}

servidor.listen(PORTA, HOST, () => {
  console.log(`Treino rodando em http://${HOST}:${PORTA}`);
  console.log(`Banco: ${CAMINHO_BD}`);
  if (SERVIR_ESTATICO) console.log(`Estático: ${RAIZ_PUBLICA}`);
});

for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, () => {
    servidor.close(() => process.exit(0));
  });
}
