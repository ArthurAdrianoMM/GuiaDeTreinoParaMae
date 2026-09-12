import {
  hoje,
  getSessao,
  salvarSerie,
  ultimaVez,
  iniciarArmazenamento,
  enviarFila,
} from './storage.js';
import { icone } from './icones.js';
import { criarRegua } from './regua.js';

// Usada se a API nao responder na primeira carga (ela abre offline).
const FICHA_PADRAO = 'ficha-mae-2026-01';

let ficha = null;
let catalogo = {};      // id -> exercicio
let treinoAtual = null; // 'A' | 'B'
const dataHoje = hoje();

// So' uma regua fica aberta por vez: duas reguas na tela e o polegar nao sabe
// qual esta' mexendo.
let gavetaAberta = null;

const el = {
  nome: document.getElementById('nome-usuario'),
  abas: document.getElementById('abas'),
  aviso: document.getElementById('aviso-acesso'),
  sessao: document.getElementById('sessao'),
  sessaoTitulo: document.getElementById('sessao-titulo'),
  sessaoConta: document.getElementById('sessao-conta'),
  trilho: document.getElementById('trilho'),
  aquecimento: document.getElementById('aquecimento'),
  comoTreinar: document.getElementById('como-treinar'),
  nota: document.getElementById('nota-ficha'),
  lista: document.getElementById('lista-exercicios'),
  sync: document.getElementById('sync'),
};

// ---------------------------------------------------------------- utilidades

function esc(texto) {
  return String(texto).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

function diaDaSemana(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return DIAS[new Date(ano, mes - 1, dia).getDay()];
}

/** Numero em portugues: 7,5 e nao 7.5. Inteiro sai sem casa decimal. */
function formatarNumero(valor) {
  return Number.isInteger(valor) ? String(valor) : String(valor).replace('.', ',');
}

/** Primeiro numero de um alvo como "10-12" ou "30-60". */
function baseDoAlvo(texto, reserva) {
  const achado = String(texto ?? '').match(/\d+(?:[.,]\d+)?/);
  return achado ? Number(achado[0].replace(',', '.')) : reserva;
}

/** Ultimo numero do mesmo alvo: o teto da faixa, que e' onde o peso sobe. */
function topoDoAlvo(texto) {
  const achados = String(texto ?? '').match(/\d+(?:[.,]\d+)?/g);
  return achados ? Number(achados.at(-1).replace(',', '.')) : null;
}

/**
 * Descanso legivel. Abaixo de um minuto fica em segundos; dai' para cima vira
 * minuto, porque "150 s" ela tem que converter de cabeca no meio do treino.
 */
function textoDescanso(valor) {
  if (!valor) return '';
  const [minimo, maximo] = Array.isArray(valor) ? valor : [valor, valor];
  const emMinutos = minimo >= 60;
  const numero = (s) => formatarNumero(emMinutos ? s / 60 : s);
  const unidade = emMinutos ? 'min' : 's';
  const faixa = minimo === maximo ? numero(minimo) : `${numero(minimo)} a ${numero(maximo)}`;
  return `${faixa} ${unidade} de descanso`;
}

function indiceMaisProximo(valores, alvo) {
  let melhor = 0;
  for (let i = 1; i < valores.length; i++) {
    if (Math.abs(valores[i] - alvo) < Math.abs(valores[melhor] - alvo)) melhor = i;
  }
  return melhor;
}

// ------------------------------------------------------- escalas das reguas
//
// A escala e' mais fina onde ela realmente trabalha. De 0 a 20 kg (halteres) o
// passo e' meio quilo; ate' 60 kg (maquinas) e' 1 kg; acima disso, 2,5 kg, que
// e' o menor pedaco que existe numa pilha de peso.

function escalaDeCarga() {
  const valores = [];
  for (let v = 0; v <= 20; v += 0.5) valores.push(Number(v.toFixed(1)));
  for (let v = 21; v <= 60; v += 1) valores.push(v);
  for (let v = 62.5; v <= 120; v += 2.5) valores.push(Number(v.toFixed(1)));
  return valores;
}

/**
 * Quais tiques levam numero escrito. Regra unica: na faixa fina (ate' 20) sai um
 * numero por unidade inteira; acima dela, de 5 em 5. Sem isso a regua vira uma
 * caixa cinza — os rotulos ficam a 300px um do outro e ela nao ve nenhum.
 */
function rotuladorDe(campo, porTempo) {
  if (porTempo && campo !== 'carga') return (v) => v % 15 === 0;
  return (v) => (v <= 20 ? Number.isInteger(v) : v % 5 === 0);
}

const CARGAS = escalaDeCarga();
const REPS = Array.from({ length: 41 }, (_, i) => i);          // 0 a 40
const TEMPOS = Array.from({ length: 37 }, (_, i) => i * 5);    // 0 a 180 s

// ------------------------------------------------------------------ estado

const TEXTO_STATUS = {
  sincronizado: { icone: 'nuvemOk', texto: 'Salvo' },
  enviando: { icone: 'nuvemSubindo', texto: 'Enviando' },
  pendente: { icone: 'relogio', texto: 'Na fila' },
  offline: { icone: 'nuvemCortada', texto: 'Salvo no aparelho' },
  'sem-token': { icone: 'chave', texto: 'Sem acesso' },
};

function mostrarStatus({ tipo, pendentes }) {
  const { icone: nome, texto } = TEXTO_STATUS[tipo] ?? { icone: 'relogio', texto: tipo };
  const sufixo = pendentes && tipo !== 'sincronizado' ? ` (${pendentes})` : '';
  el.sync.innerHTML = `${icone(nome)}<span>${esc(texto + sufixo)}</span>`;
  el.sync.dataset.status = tipo;

  const semAcesso = tipo === 'sem-token';
  el.aviso.hidden = !semAcesso;
  if (semAcesso && !el.aviso.firstChild) {
    el.aviso.innerHTML = `${icone('alerta')}
      <p><strong>Este link não tem acesso.</strong>
      O treino continua funcionando, mas nada será salvo no servidor.
      Abra o link completo que você recebeu, com o trecho <code>?k=</code> no fim.</p>`;
  }
}

// ------------------------------------------------------------------ inicio

async function iniciar() {
  const { usuario } = await iniciarArmazenamento({ onStatus: mostrarStatus });
  const fichaId = usuario?.fichaAtiva ?? FICHA_PADRAO;
  el.nome.textContent = usuario?.nome ?? 'hoje';

  const [respFicha, respCatalogo] = await Promise.all([
    fetch(`data/fichas/${fichaId}.json`),
    fetch('data/exercicios.json'),
  ]).catch(() => [null, null]);

  if (!respFicha?.ok || !respCatalogo?.ok) {
    el.lista.innerHTML = `<div class="estado">
      <strong>Não deu para carregar o treino.</strong>
      Verifique a conexão e puxe a tela para baixo para recarregar.</div>`;
    return;
  }

  ficha = await respFicha.json();
  const { exercicios } = await respCatalogo.json();
  catalogo = Object.fromEntries(exercicios.map((e) => [e.id, e]));

  montarAquecimento();
  montarComoTreinar();
  montarNota();
  montarAbas();
  selecionarTreino(ficha.treinos[0].id);
}

/**
 * Aquecimento: a soltura das articulacoes vale para a sessao inteira, e as
 * series de aproximacao so' para os primeiros exercicios. Sao dois paragrafos
 * porque sao duas coisas que ela faz em momentos diferentes.
 */
function montarAquecimento() {
  const { descricao, series } = ficha.aquecimento ?? {};
  if (!descricao) return;
  el.aquecimento.hidden = false;
  el.aquecimento.innerHTML = `${icone('aquecimento')}
    <div>
      <p><strong>Antes de começar:</strong> ${esc(descricao)}</p>
      ${series ? `<p>${esc(series)}</p>` : ''}
    </div>`;
}

/**
 * As regras que valem para todos os exercicios — peso, ritmo, quando subir.
 * Ficam fechadas: sao para consultar nas primeiras semanas, nao algo que ela
 * precise atravessar toda vez que abre o app no meio da serie.
 */
function montarComoTreinar() {
  const regras = ficha.comoTreinar;
  if (!Array.isArray(regras) || !regras.length) return;
  el.comoTreinar.hidden = false;
  el.comoTreinar.innerHTML = `
    <summary>${icone('passos')}<span>Como treinar</span>${icone('chevron', 'regras__seta')}</summary>
    <div class="regras__corpo">
      ${regras.map((r) => `<h4>${esc(r.titulo)}</h4><p>${esc(r.texto)}</p>`).join('')}
    </div>`;
}

/** A observacao da ficha: quando treinar e como isso conversa com o resto da semana. */
function montarNota() {
  if (!ficha.observacao) return;
  el.nota.hidden = false;
  el.nota.innerHTML = icone('nota') + `<div><p>${esc(ficha.observacao)}</p></div>`;
}

function montarAbas() {
  el.abas.innerHTML = '';
  for (const treino of ficha.treinos) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.treino = treino.id;
    botao.innerHTML = `${esc(treino.nome)}<small>${esc(treino.diaSugerido)}</small>`;
    botao.addEventListener('click', () => selecionarTreino(treino.id));
    el.abas.append(botao);
  }
}

function selecionarTreino(treinoId) {
  treinoAtual = treinoId;
  fecharGaveta();
  for (const botao of el.abas.children) {
    botao.setAttribute('aria-pressed', String(botao.dataset.treino === treinoId));
  }
  renderizar();
}

function treinoSelecionado() {
  return ficha.treinos.find((t) => t.id === treinoAtual);
}

function renderizar() {
  const treino = treinoSelecionado();
  el.sessao.hidden = false;
  el.sessaoTitulo.textContent = `${treino.nome} · ${diaDaSemana(dataHoje)}, ${formatarData(dataHoje).slice(0, 5)}`;

  el.lista.innerHTML = '';
  for (const item of treino.exercicios) {
    const exercicio = catalogo[item.exercicioId];
    if (!exercicio) {
      console.warn(`Exercicio "${item.exercicioId}" nao existe no catalogo.`);
      continue;
    }
    el.lista.append(criarCard(item, exercicio));
  }
  atualizarResumo();
}

// ------------------------------------------------------ o que ela fez antes

/** Os valores gravados de um campo na ultima vez, na ordem das series. */
function valoresDe(anterior, campo) {
  if (!anterior) return [];
  return anterior.series
    .map((s) => s?.[campo])
    .filter((v) => v !== '' && v != null)
    .map(Number);
}

function ultimoValorDe(anterior, campo) {
  const valores = valoresDe(anterior, campo);
  return valores.length ? valores.at(-1) : null;
}

/**
 * O treino passado, serie por serie. So' o peso nao basta: a regra de quando
 * aumentar a carga depende das repeticoes, entao elas precisam estar a' vista.
 */
function textoUltimaVez(anterior, exercicio) {
  if (!anterior) return '';
  const porTempo = exercicio.medida === 'tempo';
  const feitas = valoresDe(anterior, 'reps').map(formatarNumero);
  const carga = ultimoValorDe(anterior, 'carga');

  const partes = [];
  if (feitas.length) partes.push(feitas.join(' · ') + (porTempo ? ' s' : ''));
  if (!porTempo && carga != null) partes.push(`<b>${formatarNumero(carga)} kg</b>`);
  if (!partes.length) return '';

  return `Última vez (${esc(formatarData(anterior.data).slice(0, 5))}): ${partes.join(' com ')}`;
}

/**
 * Dupla progressao numa frase so'. Enquanto o topo da faixa nao sai em todas as
 * series, a meta e' somar uma repeticao no mesmo peso; quando sair, o peso sobe
 * e ela recomeca no pe' da faixa. Sem isso o "ultima vez: 8 kg" nao diz o que
 * fazer hoje, e a ficha fica parada no mesmo peso por meses.
 */
function dicaDeHoje(item, exercicio, anterior) {
  if (!anterior || exercicio.medida !== 'reps') return '';
  const topo = topoDoAlvo(item.reps);
  if (topo == null) return '';

  const feitas = anterior.series.filter((s) => s?.feito && s.reps !== '' && s.reps != null);
  if (!feitas.length) return '';

  const bateuOTopo = feitas.length >= item.series && feitas.every((s) => Number(s.reps) >= topo);
  if (!bateuOTopo) return 'Hoje: mesmo peso, tentando somar uma repetição.';

  const base = baseDoAlvo(item.reps, topo);
  return `Hoje: suba para o próximo peso e recomece em ${formatarNumero(base)} repetições.`;
}

/** "3 séries × 10-12", "3 séries × 30-60 s", "2 séries × 10 por perna" */
function textoAlvo(item, exercicio) {
  if (exercicio.medida === 'tempo') return `${item.series} séries × ${item.tempoSeg} s`;
  const sufixo = exercicio.unilateral ? ' por perna' : '';
  return `${item.series} séries × ${item.reps}${sufixo}`;
}

// ------------------------------------------------------------------- cartao

function criarCard(item, exercicio) {
  const sessao = getSessao(dataHoje, treinoAtual);
  const registradas = sessao?.exercicios?.[exercicio.id]?.series || [];
  const porTempo = exercicio.medida === 'tempo';
  const anterior = ultimaVez(exercicio.id, dataHoje);
  const cargaAnterior = ultimoValorDe(anterior, 'carga');
  const ultimaVezTexto = textoUltimaVez(anterior, exercicio);
  const dica = dicaDeHoje(item, exercicio, anterior);

  // Espelho local do que esta' gravado. As linhas leem daqui para descobrir o
  // valor provavel da proxima serie.
  const estados = Array.from({ length: item.series }, (_, i) => ({
    feito: Boolean(registradas[i]?.feito),
    carga: registradas[i]?.carga ?? '',
    reps: registradas[i]?.reps ?? '',
  }));

  const card = document.createElement('article');
  card.className = 'ex';

  const cabeca = document.createElement('header');
  cabeca.className = 'ex__cabeca';
  cabeca.innerHTML = `
    <h3 class="ex__nome">${esc(exercicio.nome)}</h3>
    <p class="ex__meta">${esc(exercicio.grupoPrincipal)} · ${esc(exercicio.equipamento)}</p>
    <p class="ex__prescricao">
      <span class="ex__alvo">${esc(textoAlvo(item, exercicio))}</span>
      ${item.descansoSeg ? `<span class="ex__descanso">${esc(textoDescanso(item.descansoSeg))}</span>` : ''}
    </p>
    ${ultimaVezTexto ? `<p class="ex__anterior">${ultimaVezTexto}</p>` : ''}
    ${dica ? `<p class="ex__hoje">${icone('subir')}<span>${esc(dica)}</span></p>` : ''}
  `;
  card.append(cabeca);

  const lista = document.createElement('ol');
  lista.className = 'series';
  const linhas = [];

  // Valor mais provavel para a serie `i`: o que ela ja' poz nesta serie, senao o
  // da serie anterior de hoje, senao o da ultima vez, senao o alvo prescrito.
  function padrao(campo, i) {
    if (estados[i][campo] !== '' && estados[i][campo] != null) return Number(estados[i][campo]);
    for (let j = i - 1; j >= 0; j--) {
      if (estados[j][campo] !== '' && estados[j][campo] != null) return Number(estados[j][campo]);
    }
    if (campo === 'carga') return cargaAnterior ?? 0;
    return baseDoAlvo(porTempo ? item.tempoSeg : item.reps, porTempo ? 30 : 10);
  }

  const contexto = {
    item, exercicio, porTempo, estados, padrao,
    aoGravar(indice, campos) {
      Object.assign(estados[indice], campos);
      salvarSerie({
        data: dataHoje,
        treinoId: treinoAtual,
        fichaId: ficha.id,
        exercicioId: exercicio.id,
        indice,
        campos,
      });
      // As series seguintes que ainda estao vazias herdam o valor novo.
      for (const linha of linhas) linha.atualizarSugestoes();
      atualizarResumo();
    },
  };

  for (let i = 0; i < item.series; i++) {
    const linha = criarSerie(contexto, i);
    linhas.push(linha);
    lista.append(linha.elemento);
  }
  card.append(lista);
  card.append(criarGuia(exercicio));
  return card;
}

// -------------------------------------------------------------- linha de serie

function criarSerie(contexto, indice) {
  const { exercicio, porTempo, estados, padrao, aoGravar } = contexto;
  const estado = estados[indice];

  const li = document.createElement('li');
  li.className = 'serie';
  li.dataset.feita = estado.feito ? 'sim' : 'nao';

  const linha = document.createElement('div');
  linha.className = 'serie__linha';

  // ---- marcar como feita ----
  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'check';
  check.innerHTML = icone('check');
  check.setAttribute('aria-pressed', String(estado.feito));
  check.setAttribute('aria-label', `Série ${indice + 1} de ${exercicio.nome} concluída`);

  const numero = document.createElement('span');
  numero.className = 'serie__n';
  numero.textContent = `${indice + 1}ª`;

  const valores = document.createElement('div');
  valores.className = 'serie__valores';

  const gaveta = document.createElement('div');
  gaveta.className = 'gaveta';
  gaveta.hidden = true;
  gaveta.id = `regua-${exercicio.id}-${indice}`;

  const campos = {
    carga: criarCampo('carga'),
    reps: criarCampo('reps'),
  };

  valores.append(campos.carga.chip, campos.reps.chip);
  // O check fica na direita: e' a acao principal e ela segura o halter com a
  // outra mao. O polegar direito alcanca esse canto sem trocar a pegada.
  linha.append(numero, valores, check);
  li.append(linha, gaveta);

  // ---- o botao-valor e a regua que ele abre ----

  function unidade(campo) {
    if (campo === 'carga') return 'kg';
    return porTempo ? 's' : 'reps';
  }

  function escala(campo) {
    if (campo === 'carga') return CARGAS;
    return porTempo ? TEMPOS : REPS;
  }

  function nomeDoCampo(campo) {
    if (campo === 'carga') return 'Carga';
    return porTempo ? 'Tempo' : 'Repetições';
  }

  function criarCampo(campo) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-controls', `regua-${exercicio.id}-${indice}`);
    chip.innerHTML = `<span class="chip__valor"></span><span class="chip__un">${unidade(campo)}</span>`;
    chip.addEventListener('click', () => alternar(campo));
    return { chip, valor: chip.querySelector('.chip__valor') };
  }

  function pintarChip(campo) {
    const gravado = estado[campo] !== '' && estado[campo] != null;
    const valor = gravado ? Number(estado[campo]) : padrao(campo, indice);
    const { chip, valor: alvo } = campos[campo];
    alvo.textContent = formatarNumero(valor);
    chip.classList.toggle('chip--vazio', !gravado);
    chip.setAttribute(
      'aria-label',
      `${nomeDoCampo(campo)} da série ${indice + 1} de ${exercicio.nome}: ` +
      `${formatarNumero(valor)} ${unidade(campo)}${gravado ? '' : ' (sugerido)'}. Toque para ajustar.`,
    );
  }

  let campoAberto = null;

  function fechar() {
    if (!campoAberto) return;
    campos[campoAberto].chip.setAttribute('aria-expanded', 'false');
    campoAberto = null;
    gaveta.hidden = true;
    gaveta.innerHTML = '';
    gavetaAberta = null;
  }

  function alternar(campo) {
    if (campoAberto === campo) { fechar(); return; }
    if (gavetaAberta && gavetaAberta !== fechar) gavetaAberta();
    fechar();

    campoAberto = campo;
    gavetaAberta = fechar;
    campos[campo].chip.setAttribute('aria-expanded', 'true');

    const lista = escala(campo);
    const inicial = indiceMaisProximo(lista, padrao(campo, indice));
    const leitura = document.createElement('span');
    leitura.className = 'gaveta__leitura num';
    leitura.textContent = `${formatarNumero(lista[inicial])} ${unidade(campo)}`;

    const rotulo = document.createElement('p');
    rotulo.className = 'gaveta__rotulo';
    rotulo.append(
      Object.assign(document.createElement('span'), { textContent: `${nomeDoCampo(campo)} · série ${indice + 1}` }),
      leitura,
    );

    const regua = criarRegua({
      valores: lista,
      indice: inicial,
      rotular: rotuladorDe(campo, porTempo),
      salto: campo === 'carga' ? 10 : 5,
      sufixo: unidade(campo),
      aria: `${nomeDoCampo(campo)} da série ${indice + 1} de ${exercicio.nome}, em ${unidade(campo)}`,
      formatar: formatarNumero,
      aoMudar(valor) {
        leitura.textContent = `${formatarNumero(valor)} ${unidade(campo)}`;
        campos[campo].valor.textContent = formatarNumero(valor);
        campos[campo].chip.classList.remove('chip--vazio');
      },
      aoParar(valor) {
        aoGravar(indice, { [campo]: valor });
        pintarChip(campo);
      },
    });

    gaveta.hidden = false;
    gaveta.append(rotulo, regua.elemento);
    regua.montada();
    regua.focar();
  }

  // ---- marcar feita grava o que esta' na tela ----

  check.addEventListener('click', () => {
    const feito = !estado.feito;
    const mudancas = { feito };

    // Ela marcou sem mexer nos valores: vale o que o botao esta' mostrando.
    // Assim uma serie inteira custa um toque so'.
    if (feito) {
      if (estado.carga === '' || estado.carga == null) mudancas.carga = padrao('carga', indice);
      if (estado.reps === '' || estado.reps == null) mudancas.reps = padrao('reps', indice);
    }

    // Serie concluida encerra o ajuste: deixar a regua aberta embaixo de uma
    // serie ja' marcada e' um estado que nao quer dizer nada.
    if (feito) fechar();
    check.setAttribute('aria-pressed', String(feito));
    li.dataset.feita = feito ? 'sim' : 'nao';
    aoGravar(indice, mudancas);
    pintarChip('carga');
    pintarChip('reps');
  });

  pintarChip('carga');
  pintarChip('reps');

  return {
    elemento: li,
    atualizarSugestoes() {
      if (campoAberto !== 'carga') pintarChip('carga');
      if (campoAberto !== 'reps') pintarChip('reps');
    },
  };
}

function fecharGaveta() {
  if (gavetaAberta) gavetaAberta();
}

// ---------------------------------------------------------------- guia

function criarGuia(exercicio) {
  const bloco = document.createElement('details');
  bloco.className = 'guia';

  const resumo = document.createElement('summary');
  resumo.innerHTML = `${icone('video')}<span>Como fazer e vídeo</span>${icone('chevron', 'guia__seta')}`;
  bloco.append(resumo);

  const corpo = document.createElement('div');
  corpo.className = 'guia__corpo';
  corpo.innerHTML = `
    <p><strong>Para que serve:</strong> ${esc(exercicio.porque)}</p>
    <h4>${icone('passos')}<span>Passo a passo</span></h4>
    <ol>${exercicio.comoFazer.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
    <div class="guia__atencao">
      <h4>${icone('alerta')}<span>Atenção</span></h4>
      <ul>${exercicio.atencao.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>
    <p class="musculos">Músculos: ${esc(exercicio.grupos.join(', '))}</p>
  `;

  const video = document.createElement('div');
  video.className = exercicio.videoVertical ? 'video video--vertical' : 'video';
  if (exercicio.video) {
    // O iframe so' e' criado quando ela abre os detalhes: 12 iframes carregando
    // de uma vez travaria o celular e gastaria dados a toa.
    bloco.addEventListener('toggle', () => {
      if (bloco.open && !video.firstChild) {
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube-nocookie.com/embed/${exercicio.video}`;
        frame.title = `Vídeo: ${exercicio.nome}`;
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        video.append(frame);
      }
    });
  } else {
    video.innerHTML = `<p class="video__ausente">${icone('video')}<span>Vídeo ainda não cadastrado para este exercício.</span></p>`;
  }
  // O video vem antes do texto: ver o movimento primeiro e depois ler os passos.
  corpo.prepend(video);

  bloco.append(corpo);
  return bloco;
}

// -------------------------------------------------------------- barra da sessao

function atualizarResumo() {
  const treino = treinoSelecionado();
  const sessao = getSessao(dataHoje, treinoAtual);

  let feitas = 0;
  let alvo = 0;

  for (const item of treino.exercicios) {
    alvo += item.series;
    const series = sessao?.exercicios?.[item.exercicioId]?.series || [];
    feitas += series.filter((s) => s?.feito).length;
  }

  const completo = feitas === alvo;
  el.sessao.classList.toggle('sessao--completa', completo);
  el.sessaoConta.textContent = completo
    ? `Treino completo · ${feitas} séries`
    : `${feitas} de ${alvo} séries`;
  el.trilho.style.transform = `scaleX(${alvo ? feitas / alvo : 0})`;
}

// Ultima chance de enviar o que ficou pendente antes de a tela apagar.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') enviarFila();
});

iniciar();
