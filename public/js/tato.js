// Retorno tatil. Um toque curto a cada tique da regua: ela sente que mudou de
// valor sem precisar olhar a tela enquanto segura o halter com a outra mao.
//
// Limite conhecido: Safari no iPhone nao expoe a Vibration API. Em iPhone a regua
// funciona igual, so' sem o toque. Android/Chrome vibra.

const DURACAO = 6; // ms — perceptivel no polegar, inaudivel na academia

let permitido = true;

if (typeof window !== 'undefined' && window.matchMedia) {
  const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
  permitido = !preferencia.matches;
  preferencia.addEventListener('change', (e) => { permitido = !e.matches; });
}

export function vibrar(duracao = DURACAO) {
  if (!permitido) return;
  try {
    navigator.vibrate?.(duracao);
  } catch {
    // Alguns navegadores recusam vibrar fora de um gesto do usuario. Sem drama.
  }
}
