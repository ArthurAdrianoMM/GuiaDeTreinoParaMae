// Camada de persistencia.
// Hoje: localStorage. Amanha: fetch para /api/*.
// O resto do app so conhece as funcoes exportadas aqui - nenhuma outra parte
// do codigo toca em localStorage. Trocar por backend = reescrever so este arquivo.

const CHAVE = 'treino:sessoes:v1';

function carregarTudo() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {};
  } catch {
    return {};
  }
}

function salvarTudo(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch (e) {
    console.error('Nao foi possivel salvar:', e);
  }
}

/** Data de hoje em AAAA-MM-DD no fuso local (toISOString usa UTC e erra o dia). */
export function hoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Sessao = um dia de treino. Espelha a tabela `sessoes` do schema.
 * Criada sob demanda: so passa a existir quando ela registra a primeira serie.
 * E' isso que torna a presenca automatica.
 */
export function getSessao(data, treinoId) {
  const tudo = carregarTudo();
  return tudo[`${data}|${treinoId}`] || null;
}

export function listarSessoes() {
  const tudo = carregarTudo();
  return Object.entries(tudo)
    .map(([chave, sessao]) => {
      const [data, treinoId] = chave.split('|');
      return { data, treinoId, ...sessao };
    })
    .sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Registra o estado de UMA serie. Espelha a tabela `series`.
 * campos: { feito, carga, reps }  (reps guarda segundos nos exercicios de tempo)
 */
export function salvarSerie({ data, treinoId, fichaId, exercicioId, indice, campos }) {
  const tudo = carregarTudo();
  const chave = `${data}|${treinoId}`;

  const sessao = tudo[chave] || { fichaId, exercicios: {} };
  const exercicio = sessao.exercicios[exercicioId] || { series: [] };
  const serie = exercicio.series[indice] || { feito: false, carga: '', reps: '' };

  exercicio.series[indice] = { ...serie, ...campos };
  sessao.exercicios[exercicioId] = exercicio;
  tudo[chave] = sessao;

  salvarTudo(tudo);
  return tudo[chave];
}

/** Ultima carga registrada para um exercicio, em qualquer sessao anterior. */
export function ultimaCarga(exercicioId, dataAtual) {
  for (const sessao of listarSessoes()) {
    if (sessao.data >= dataAtual) continue;
    const series = sessao.exercicios?.[exercicioId]?.series || [];
    const comCarga = series.filter((s) => s && s.carga !== '' && s.carga != null);
    if (comCarga.length) {
      return { carga: comCarga[comCarga.length - 1].carga, data: sessao.data };
    }
  }
  return null;
}
