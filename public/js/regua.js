// Regua: escolher um numero arrastando o dedo na horizontal, sem teclado.
//
// Por que nao um <input type="number">: no celular ele abre o teclado numerico,
// que cobre metade da tela no meio do treino, exige mira fina com o dedo suado e
// aceita "88" onde ela quis "8". A regua nao cobre nada, tem alvo do tamanho do
// polegar e so' oferece valores que existem.
//
// A regua abre ja' centrada no valor mais provavel (ver `indiceInicial` em app.js),
// entao o caso comum — repetir a carga da serie anterior — custa zero movimento.

import { vibrar } from './tato.js';

/** Espera o fim do arrasto quando o navegador nao tem 'scrollend'. */
const ESPERA_PARADA = 140;

/**
 * @param {object}   opcoes
 * @param {number[]} opcoes.valores      valores selecionaveis, em ordem crescente
 * @param {number}   opcoes.indice       indice inicial
 * @param {Function} opcoes.rotular      (valor) => se esse tique leva numero escrito
 * @param {number}   opcoes.salto        de quantos em quantos valores PageUp/PageDown anda
 * @param {string}   opcoes.sufixo       unidade mostrada ao lado do numero
 * @param {string}   opcoes.aria         nome acessivel do controle
 * @param {Function} opcoes.formatar     (valor) => string
 * @param {Function} opcoes.aoMudar      dispara a cada tique cruzado
 * @param {Function} opcoes.aoParar      dispara quando o dedo para (hora de gravar)
 */
export function criarRegua({
  valores,
  indice,
  rotular,
  salto = 5,
  sufixo,
  aria,
  formatar,
  aoMudar = () => {},
  aoParar = () => {},
}) {
  let atual = Math.min(Math.max(indice, 0), valores.length - 1);
  let passo = 0;          // distancia em px entre dois tiques, medida no DOM
  let ignorarScroll = false;

  const raiz = document.createElement('div');
  raiz.className = 'regua';
  raiz.tabIndex = 0;
  raiz.setAttribute('role', 'slider');
  raiz.setAttribute('aria-label', aria);
  raiz.setAttribute('aria-valuemin', String(valores[0]));
  raiz.setAttribute('aria-valuemax', String(valores.at(-1)));
  raiz.setAttribute('aria-orientation', 'horizontal');

  const pista = document.createElement('div');
  pista.className = 'regua__pista';

  const tiques = valores.map((valor, i) => {
    const tique = document.createElement('span');
    const rotulado = rotular(valor) || i === 0 || i === valores.length - 1;
    tique.className = `regua__tique${rotulado ? ' regua__tique--maior' : ''}`;
    tique.dataset.i = String(i);
    if (rotulado) {
      const texto = document.createElement('span');
      texto.className = 'regua__numero';
      texto.textContent = formatar(valor);
      tique.append(texto);
    }
    return tique;
  });
  pista.append(...tiques);

  const agulha = document.createElement('span');
  agulha.className = 'regua__agulha';
  agulha.setAttribute('aria-hidden', 'true');

  raiz.append(pista, agulha);

  // ---------- medidas ----------

  function medir() {
    if (passo) return passo;
    passo = tiques.length > 1 ? tiques[1].offsetLeft - tiques[0].offsetLeft : 1;
    return passo;
  }

  function posicionar(i, suave) {
    medir();
    ignorarScroll = true;
    pista.scrollTo({ left: i * passo, behavior: suave ? 'smooth' : 'instant' });
    // O scroll suave ainda vai emitir eventos; solta a trava depois dele.
    setTimeout(() => { ignorarScroll = false; }, suave ? 320 : 0);
  }

  function anunciar() {
    const valor = valores[atual];
    raiz.setAttribute('aria-valuenow', String(valor));
    raiz.setAttribute('aria-valuetext', `${formatar(valor)} ${sufixo}`);
    for (const tique of tiques) {
      tique.classList.toggle('esta-no-centro', Number(tique.dataset.i) === atual);
    }
  }

  function selecionar(i, { tatil = true } = {}) {
    const novo = Math.min(Math.max(i, 0), valores.length - 1);
    if (novo === atual) return;
    atual = novo;
    if (tatil) vibrar();
    anunciar();
    aoMudar(valores[atual]);
  }

  // ---------- arrasto ----------

  let parada;
  pista.addEventListener('scroll', () => {
    if (!ignorarScroll) selecionar(Math.round(pista.scrollLeft / medir()));
    if (!('onscrollend' in pista)) {
      clearTimeout(parada);
      parada = setTimeout(() => aoParar(valores[atual]), ESPERA_PARADA);
    }
  }, { passive: true });

  if ('onscrollend' in pista) {
    pista.addEventListener('scrollend', () => aoParar(valores[atual]));
  }

  // Tocar direto num numero vale tanto quanto arrastar ate' ele.
  pista.addEventListener('click', (evento) => {
    const tique = evento.target.closest('.regua__tique');
    if (!tique) return;
    selecionar(Number(tique.dataset.i));
    posicionar(atual, true);
    aoParar(valores[atual]);
  });

  // No computador o dedo vira roda do mouse: trackpad vertical tambem anda a regua.
  raiz.addEventListener('wheel', (evento) => {
    const delta = Math.abs(evento.deltaX) > Math.abs(evento.deltaY) ? evento.deltaX : evento.deltaY;
    if (!delta) return;
    evento.preventDefault();
    pista.scrollLeft += delta;
  }, { passive: false });

  // ---------- teclado ----------

  const SALTOS = {
    ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1,
    PageUp: salto, PageDown: -salto,
  };

  raiz.addEventListener('keydown', (evento) => {
    let destino = null;
    if (evento.key in SALTOS) destino = atual + SALTOS[evento.key];
    else if (evento.key === 'Home') destino = 0;
    else if (evento.key === 'End') destino = valores.length - 1;
    if (destino === null) return;

    evento.preventDefault();
    selecionar(destino, { tatil: false });
    posicionar(atual, false);
    aoParar(valores[atual]);
  });

  anunciar();

  return {
    elemento: raiz,
    get valor() { return valores[atual]; },
    /** Chamar depois de inserir no documento: antes disso nao da' para medir. */
    montada() {
      posicionar(atual, false);
      anunciar();
    },
    focar() { raiz.focus({ preventScroll: true }); },
  };
}
