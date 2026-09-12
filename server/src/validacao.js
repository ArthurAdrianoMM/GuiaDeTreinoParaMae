// Validacao da entrada da API. Tudo que vem do cliente passa por aqui.

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-zA-Z0-9_-]{1,64}$/;
const MAX_REGISTROS = 500;

function texto(valor, limite) {
  if (valor === null || valor === undefined || valor === '') return null;
  const s = String(valor).slice(0, limite).trim();
  return s === '' ? null : s;
}

/** Numero em texto ("8", "12.5"). Guardo como texto porque o campo aceita vazio. */
function numeroTexto(valor) {
  const s = texto(valor, 10);
  if (s === null) return null;
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(s)) return null;
  return s.replace(',', '.');
}

export function validarRegistros(corpo) {
  const lista = corpo?.registros;
  if (!Array.isArray(lista)) throw Object.assign(new Error('"registros" deve ser uma lista'), { status: 400 });
  if (lista.length === 0) return [];
  if (lista.length > MAX_REGISTROS) {
    throw Object.assign(new Error(`Máximo de ${MAX_REGISTROS} registros por envio`), { status: 400 });
  }

  const agora = Date.now();
  return lista.map((r, i) => {
    const falhar = (msg) => {
      throw Object.assign(new Error(`registro ${i}: ${msg}`), { status: 400 });
    };

    if (!DATA_ISO.test(r?.data ?? '')) falhar('data inválida (esperado AAAA-MM-DD)');
    if (!ID.test(r?.treinoId ?? '')) falhar('treinoId inválido');
    if (!ID.test(r?.fichaId ?? '')) falhar('fichaId inválido');
    if (!ID.test(r?.exercicioId ?? '')) falhar('exercicioId inválido');

    const indice = Number(r?.indice);
    if (!Number.isInteger(indice) || indice < 0 || indice > 49) falhar('indice fora do intervalo');

    // Carimbo do cliente decide conflitos, mas nao pode vir do futuro
    // (relogio do celular errado congelaria o registro para sempre).
    const carimbo = Number(r?.atualizadoEm);
    const atualizadoEm = Number.isFinite(carimbo) && carimbo > 0 ? Math.min(carimbo, agora) : agora;

    return {
      data: r.data,
      treinoId: r.treinoId,
      fichaId: r.fichaId,
      exercicioId: r.exercicioId,
      indice,
      feito: Boolean(r.feito),
      carga: numeroTexto(r.carga),
      reps: numeroTexto(r.reps),
      atualizadoEm,
    };
  });
}

export function validarDesde(valor) {
  if (!valor) return null;
  return DATA_ISO.test(valor) ? valor : null;
}
