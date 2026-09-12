// Sistema de icones autorais. Um so' traco (1.75), um so' viewBox, currentColor.
// Nada de emoji na interface: emoji muda de desenho em cada aparelho e nao aceita
// a cor nem a espessura do resto da tela.

const TRACOS = {
  // Confirmacao — usado no botao redondo de serie feita.
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',

  // Revelar/ocultar (guia do exercicio, ficha de valores).
  chevron: '<path d="M6 9.5 12 15.5 18 9.5"/>',

  // Estados de sincronia.
  nuvemOk: '<path d="M6.8 18.5A3.8 3.8 0 0 1 6.4 11a5.6 5.6 0 0 1 10.8-1.4A4.4 4.4 0 0 1 17.4 18.5Z"/><path d="m9.4 13.9 2 2 3.5-3.9"/>',
  nuvemSubindo: '<path d="M6.8 18.5A3.8 3.8 0 0 1 6.4 11a5.6 5.6 0 0 1 10.8-1.4A4.4 4.4 0 0 1 17.4 18.5Z"/><path d="M12 19.5v-6.4"/><path d="m9.6 15.2 2.4-2.4 2.4 2.4"/>',
  nuvemCortada: '<path d="M6.8 18.5A3.8 3.8 0 0 1 6.4 11a5.6 5.6 0 0 1 10.8-1.4A4.4 4.4 0 0 1 17.4 18.5Z"/><path d="M4 4.5 20 20.5"/>',
  relogio: '<circle cx="12" cy="12" r="8"/><path d="M12 7.6V12l3 2"/>',

  // Avisos.
  alerta: '<path d="M12 4.8 21 19.6H3Z"/><path d="M12 10.4v3.8"/><path d="M12 17h.01"/>',
  nota: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11.4v4.6"/><path d="M12 8.2h.01"/>',
  chave: '<circle cx="8.2" cy="15.8" r="3.3"/><path d="m10.6 13.4 7.6-7.6"/><path d="m15.6 8.4 2.2 2.2"/><path d="m18 6 2.2 2.2"/>',

  // Conteudo.
  video: '<circle cx="12" cy="12" r="8.2"/><path d="M10.4 9.1 15 12l-4.6 2.9Z"/>',
  aquecimento: '<path d="M3.5 12.5h3.8l2-4.6 3 9.2 2.2-6 1.6 3.4h4.4"/>',
  passos: '<path d="M9 6.8h11"/><path d="M9 12h11"/><path d="M9 17.2h11"/><path d="M4.6 6.8h.01"/><path d="M4.6 12h.01"/><path d="M4.6 17.2h.01"/>',

  // Progressao: o alvo de hoje esta' um degrau acima do da ultima vez.
  subir: '<path d="M12 19.2V6"/><path d="m6.6 11.4 5.4-5.4 5.4 5.4"/>',
};

/**
 * Devolve o markup do icone. `classe` entra junto de `ic` para ajuste pontual.
 * aria-hidden sempre: o texto ao lado e' que nomeia a acao.
 */
export function icone(nome, classe = '') {
  const tracos = TRACOS[nome];
  if (!tracos) throw new Error(`Icone desconhecido: ${nome}`);
  return `<svg class="ic ${classe}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${tracos}</svg>`;
}

/** Versao que devolve um no' pronto, para quem monta a arvore no DOM. */
export function noIcone(nome, classe = '') {
  const molde = document.createElement('template');
  molde.innerHTML = icone(nome, classe);
  return molde.content.firstElementChild;
}
