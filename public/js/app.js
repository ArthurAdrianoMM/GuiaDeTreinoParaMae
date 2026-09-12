import { hoje, getSessao, salvarSerie, ultimaCarga } from './storage.js';

const FICHA_ATIVA = 'ficha-mae-2026-01';

let ficha = null;
let catalogo = {};      // id -> exercicio
let treinoAtual = null; // 'A' | 'B'
const dataHoje = hoje();

const el = {
  abas: document.getElementById('abas'),
  titulo: document.getElementById('titulo-treino'),
  aquecimento: document.getElementById('aquecimento'),
  lista: document.getElementById('lista-exercicios'),
  resumo: document.getElementById('resumo'),
};

async function iniciar() {
  const [respFicha, respCatalogo] = await Promise.all([
    fetch(`data/fichas/${FICHA_ATIVA}.json`),
    fetch('data/exercicios.json'),
  ]);

  if (!respFicha.ok || !respCatalogo.ok) {
    el.lista.textContent = 'Nao foi possivel carregar o treino.';
    return;
  }

  ficha = await respFicha.json();
  const { exercicios } = await respCatalogo.json();
  catalogo = Object.fromEntries(exercicios.map((e) => [e.id, e]));

  montarAbas();
  selecionarTreino(ficha.treinos[0].id);
}

function montarAbas() {
  el.abas.innerHTML = '';
  for (const treino of ficha.treinos) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.treino = treino.id;
    botao.textContent = `${treino.nome} (${treino.diaSugerido})`;
    botao.addEventListener('click', () => selecionarTreino(treino.id));
    el.abas.append(botao);
  }
}

function selecionarTreino(treinoId) {
  treinoAtual = treinoId;
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
  el.titulo.textContent = `${treino.nome} — ${treino.diaSugerido}`;
  el.aquecimento.textContent = `Aquecimento: ${ficha.aquecimento.descricao}`;

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

/** "3 séries × 10-12", "3 séries × 30-60s", "2 séries × 10 por perna" */
function textoAlvo(item, exercicio) {
  if (exercicio.medida === 'tempo') return `${item.series} séries × ${item.tempoSeg}s`;
  const sufixo = exercicio.unilateral ? ' por perna' : '';
  return `${item.series} séries × ${item.reps}${sufixo}`;
}

function criarCard(item, exercicio) {
  const sessao = getSessao(dataHoje, treinoAtual);
  const registradas = sessao?.exercicios?.[exercicio.id]?.series || [];
  const porTempo = exercicio.medida === 'tempo';

  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.exercicio = exercicio.id;

  // ---- Cabecalho ----
  const cabecalho = document.createElement('header');
  cabecalho.innerHTML = `
    <h3>${exercicio.nome}</h3>
    <p class="meta">${exercicio.grupoPrincipal} · ${exercicio.equipamento}</p>
    <p class="alvo">${textoAlvo(item, exercicio)}</p>
  `;

  const anterior = ultimaCarga(exercicio.id, dataHoje);
  if (anterior) {
    const dica = document.createElement('p');
    dica.className = 'anterior';
    dica.textContent = `Última vez: ${anterior.carga} kg (${formatarData(anterior.data)})`;
    cabecalho.append(dica);
  }
  card.append(cabecalho);

  // ---- Series ----
  const tabela = document.createElement('table');
  tabela.className = 'series';
  tabela.innerHTML = `
    <thead>
      <tr>
        <th>Feita</th>
        <th>Série</th>
        <th>Carga (kg)</th>
        <th>${porTempo ? 'Tempo (s)' : 'Reps'}</th>
      </tr>
    </thead>
  `;

  const corpo = document.createElement('tbody');
  for (let i = 0; i < item.series; i++) {
    corpo.append(criarLinhaSerie({ item, exercicio, indice: i, registrada: registradas[i], porTempo }));
  }
  tabela.append(corpo);
  card.append(tabela);

  // ---- Detalhes colapsaveis ----
  card.append(criarDetalhes(exercicio));

  return card;
}

function criarLinhaSerie({ item, exercicio, indice, registrada, porTempo }) {
  const estado = registrada || { feito: false, carga: '', reps: '' };
  const linha = document.createElement('tr');

  const gravar = (campos) => {
    salvarSerie({
      data: dataHoje,
      treinoId: treinoAtual,
      fichaId: ficha.id,
      exercicioId: exercicio.id,
      indice,
      campos,
    });
    atualizarResumo();
  };

  // Feita
  const tdFeito = document.createElement('td');
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = Boolean(estado.feito);
  check.setAttribute('aria-label', `Série ${indice + 1} de ${exercicio.nome} concluída`);
  check.addEventListener('change', () => {
    gravar({ feito: check.checked });
    linha.classList.toggle('feita', check.checked);
  });
  tdFeito.append(check);

  // Numero
  const tdNumero = document.createElement('td');
  tdNumero.textContent = indice + 1;

  // Carga
  const tdCarga = document.createElement('td');
  const carga = campoNumero({
    valor: estado.carga,
    placeholder: '—',
    aria: `Carga da série ${indice + 1} de ${exercicio.nome}`,
  });
  aoDigitar(carga, (valor) => gravar({ carga: valor }));
  tdCarga.append(carga);

  // Reps ou tempo
  const tdReps = document.createElement('td');
  const reps = campoNumero({
    valor: estado.reps,
    placeholder: porTempo ? item.tempoSeg : item.reps,
    aria: `${porTempo ? 'Tempo' : 'Repetições'} da série ${indice + 1} de ${exercicio.nome}`,
  });
  aoDigitar(reps, (valor) => gravar({ reps: valor }));
  tdReps.append(reps);

  linha.classList.toggle('feita', Boolean(estado.feito));
  linha.append(tdFeito, tdNumero, tdCarga, tdReps);
  return linha;
}

/**
 * Salva enquanto ela digita (com folego de 400ms) e tambem ao sair do campo.
 * So o evento 'change' nao basta: ele so dispara quando o campo perde o foco,
 * entao digitar a carga e bloquear a tela do celular perderia o dado.
 */
function aoDigitar(campo, aoMudar) {
  let temporizador;
  campo.addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aoMudar(campo.value), 400);
  });
  campo.addEventListener('change', () => {
    clearTimeout(temporizador);
    aoMudar(campo.value);
  });
}

function campoNumero({ valor, placeholder, aria }) {
  const campo = document.createElement('input');
  campo.type = 'number';
  campo.inputMode = 'decimal'; // teclado numerico no celular
  campo.min = '0';
  campo.step = 'any';
  campo.value = valor ?? '';
  campo.placeholder = placeholder ?? '';
  campo.setAttribute('aria-label', aria);
  return campo;
}

function criarDetalhes(exercicio) {
  const bloco = document.createElement('details');
  bloco.className = 'detalhes';

  const resumo = document.createElement('summary');
  resumo.textContent = 'Como fazer e vídeo';
  bloco.append(resumo);

  const conteudo = document.createElement('div');
  conteudo.innerHTML = `
    <p class="porque"><strong>Para que serve:</strong> ${exercicio.porque}</p>
    <h4>Passo a passo</h4>
    <ol>${exercicio.comoFazer.map((p) => `<li>${p}</li>`).join('')}</ol>
    <h4>Atenção</h4>
    <ul>${exercicio.atencao.map((p) => `<li>${p}</li>`).join('')}</ul>
    <p class="grupos"><strong>Músculos:</strong> ${exercicio.grupos.join(', ')}</p>
  `;

  const video = document.createElement('div');
  video.className = 'video';
  if (exercicio.video) {
    // O iframe so e' criado quando ela abre os detalhes: 12 iframes carregando
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
    video.innerHTML = '<p class="pendente">Vídeo ainda não cadastrado.</p>';
  }
  conteudo.append(video);

  bloco.append(conteudo);
  return bloco;
}

function atualizarResumo() {
  const treino = treinoSelecionado();
  const sessao = getSessao(dataHoje, treinoAtual);

  let feitas = 0;
  let alvo = 0;
  let exerciciosIniciados = 0;

  for (const item of treino.exercicios) {
    alvo += item.series;
    const series = sessao?.exercicios?.[item.exercicioId]?.series || [];
    const concluidas = series.filter((s) => s?.feito).length;
    feitas += concluidas;
    if (concluidas > 0) exerciciosIniciados++;
  }

  const presente = feitas > 0;
  el.resumo.innerHTML = `
    <strong>${formatarData(dataHoje)}</strong> ·
    ${feitas} de ${alvo} séries ·
    ${exerciciosIniciados} de ${treino.exercicios.length} exercícios
    ${presente ? '<span class="presenca">✓ Treino registrado hoje</span>' : ''}
  `;
}

function formatarData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

iniciar();
