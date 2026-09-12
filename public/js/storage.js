// Camada de persistencia: local-first.
//
// Toda gravacao vai primeiro para o localStorage (instantanea, funciona sem rede)
// e entra numa fila que e' enviada ao servidor quando da'. Na academia o wifi cai,
// e um app que trava esperando resposta de rede e' um app que ela desiste de usar.
//
// Nenhuma outra parte do codigo toca em localStorage nem em fetch.

const CHAVE_CACHE = 'treino:sessoes:v1';
const CHAVE_FILA = 'treino:fila:v1';
const CHAVE_TOKEN = 'treino:token:v1';

let token = null;
let aoMudarStatus = () => {};
let enviando = false;

// ---------- utilidades de armazenamento ----------

function ler(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
}

function escrever(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.error('Não foi possível salvar localmente:', e);
  }
}

/** Data de hoje em AAAA-MM-DD no fuso local (toISOString usa UTC e erra o dia). */
export function hoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---------- token ----------

function resolverToken() {
  const url = new URL(location.href);
  const daUrl = url.searchParams.get('k');

  if (daUrl) {
    localStorage.setItem(CHAVE_TOKEN, daUrl);
    // Tira o token da barra de endereco depois de guardado.
    // O atalho que ela salvou na tela de inicio continua tendo o ?k=.
    url.searchParams.delete('k');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    return daUrl;
  }

  return localStorage.getItem(CHAVE_TOKEN);
}

async function chamarApi(caminho, opcoes = {}) {
  const resposta = await fetch(`api/${caminho}`, {
    ...opcoes,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...opcoes.headers,
    },
  });

  if (resposta.status === 401) throw Object.assign(new Error('Token inválido'), { semAutorizacao: true });
  if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
  return resposta.json();
}

// ---------- inicializacao ----------

/**
 * Prepara o armazenamento. Resolve o token, busca o usuario e puxa o historico.
 * Sempre resolve - se a rede falhar, segue com o que esta' em cache.
 */
export async function iniciarArmazenamento({ onStatus } = {}) {
  aoMudarStatus = onStatus ?? (() => {});
  token = resolverToken();

  if (!token) {
    aoMudarStatus({ tipo: 'sem-token' });
    return { usuario: null, online: false };
  }

  let usuario = null;
  let online = false;

  try {
    usuario = await chamarApi('eu');
    const { sessoes } = await chamarApi('sessoes');
    mesclarDoServidor(sessoes);
    online = true;
    aoMudarStatus({ tipo: 'sincronizado' });
  } catch (e) {
    if (e.semAutorizacao) {
      aoMudarStatus({ tipo: 'sem-token' });
      return { usuario: null, online: false };
    }
    aoMudarStatus({ tipo: 'offline' });
  }

  enviarFila();
  window.addEventListener('online', enviarFila);
  return { usuario, online };
}

/**
 * Junta o que veio do servidor com o que esta' no aparelho.
 * Ganha a versao com carimbo mais novo - a mesma regra que o servidor aplica,
 * entao os dois lados convergem para o mesmo resultado.
 */
function mesclarDoServidor(remotas) {
  const local = ler(CHAVE_CACHE, {});

  for (const [chave, sessaoRemota] of Object.entries(remotas)) {
    const sessaoLocal = local[chave];
    if (!sessaoLocal) {
      local[chave] = sessaoRemota;
      continue;
    }

    for (const [exercicioId, exRemoto] of Object.entries(sessaoRemota.exercicios)) {
      const exLocal = (sessaoLocal.exercicios[exercicioId] ??= { series: [] });
      exRemoto.series.forEach((serieRemota, i) => {
        if (!serieRemota) return;
        const serieLocal = exLocal.series[i];
        if (!serieLocal || (serieRemota.atualizadoEm ?? 0) > (serieLocal.atualizadoEm ?? 0)) {
          exLocal.series[i] = serieRemota;
        }
      });
    }
  }

  escrever(CHAVE_CACHE, local);
}

// ---------- leitura (sempre do cache local, sempre sincrona) ----------

export function getSessao(data, treinoId) {
  return ler(CHAVE_CACHE, {})[`${data}|${treinoId}`] ?? null;
}

export function listarSessoes() {
  return Object.entries(ler(CHAVE_CACHE, {}))
    .map(([chave, sessao]) => {
      const [data, treinoId] = chave.split('|');
      return { data, treinoId, ...sessao };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

/** Ultima carga registrada para um exercicio, em qualquer sessao anterior. */
export function ultimaCarga(exercicioId, dataAtual) {
  for (const sessao of listarSessoes()) {
    if (sessao.data >= dataAtual) continue;
    const series = sessao.exercicios?.[exercicioId]?.series ?? [];
    const comCarga = series.filter((s) => s && s.carga !== '' && s.carga != null);
    if (comCarga.length) return { carga: comCarga.at(-1).carga, data: sessao.data };
  }
  return null;
}

// ---------- escrita ----------

export function salvarSerie({ data, treinoId, fichaId, exercicioId, indice, campos }) {
  const atualizadoEm = Date.now();

  const cache = ler(CHAVE_CACHE, {});
  const chave = `${data}|${treinoId}`;
  const sessao = (cache[chave] ??= { fichaId, exercicios: {} });
  const exercicio = (sessao.exercicios[exercicioId] ??= { series: [] });
  const serie = exercicio.series[indice] ?? { feito: false, carga: '', reps: '' };

  exercicio.series[indice] = { ...serie, ...campos, atualizadoEm };
  escrever(CHAVE_CACHE, cache);

  enfileirar({
    data,
    treinoId,
    fichaId,
    exercicioId,
    indice,
    ...exercicio.series[indice],
  });

  return cache[chave];
}

/**
 * Fila de envio. Guarda uma entrada por serie (chave data|treino|exercicio|indice):
 * se ela corrigir a carga tres vezes offline, so a ultima versao e' enviada.
 */
function enfileirar(registro) {
  const fila = ler(CHAVE_FILA, {});
  fila[`${registro.data}|${registro.treinoId}|${registro.exercicioId}|${registro.indice}`] = registro;
  escrever(CHAVE_FILA, fila);
  agendarEnvio();
}

let temporizador;
let esperaRetentativa = 0;

function agendarEnvio(atraso = 1200) {
  clearTimeout(temporizador);
  temporizador = setTimeout(enviarFila, atraso);
}

/**
 * Retentativa com espera crescente (5s, 10s, 20s... ate' 60s).
 * Sem isso, se ela ficasse sem sinal e parasse de mexer na tela,
 * a fila so' subiria na proxima vez que abrisse o app.
 */
function agendarRetentativa() {
  esperaRetentativa = esperaRetentativa ? Math.min(esperaRetentativa * 2, 60_000) : 5_000;
  agendarEnvio(esperaRetentativa);
}

export async function enviarFila() {
  if (enviando || !token) return;

  const fila = ler(CHAVE_FILA, {});
  const registros = Object.values(fila);
  if (!registros.length) return;

  enviando = true;
  aoMudarStatus({ tipo: 'enviando', pendentes: registros.length });

  try {
    await chamarApi('series', { method: 'POST', body: JSON.stringify({ registros }) });

    // Remove so' o que foi enviado: o que ela marcou durante o envio fica na fila.
    const atual = ler(CHAVE_FILA, {});
    for (const r of registros) {
      const chave = `${r.data}|${r.treinoId}|${r.exercicioId}|${r.indice}`;
      if (atual[chave]?.atualizadoEm === r.atualizadoEm) delete atual[chave];
    }
    escrever(CHAVE_FILA, atual);

    esperaRetentativa = 0;
    const restantes = Object.keys(atual).length;
    if (restantes) agendarEnvio();
    aoMudarStatus(restantes ? { tipo: 'pendente', pendentes: restantes } : { tipo: 'sincronizado' });
  } catch (e) {
    aoMudarStatus({
      tipo: e.semAutorizacao ? 'sem-token' : 'offline',
      pendentes: registros.length,
    });
    // Token invalido nao melhora com o tempo - so' vale reinsistir se for rede.
    if (!e.semAutorizacao) agendarRetentativa();
  } finally {
    enviando = false;
  }
}

export function pendentes() {
  return Object.keys(ler(CHAVE_FILA, {})).length;
}
