/**
 * No iPhone o teclado não diminui a tela "de layout", só a área visível.
 * Publica a altura/topo da área visível em --vvh/--vvt para as janelas
 * (Dialog) caberem acima do teclado em vez de ficarem cobertas.
 */
export function trackVisualViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement;
  const update = () => {
    root.style.setProperty('--vvh', `${vv.height}px`);
    root.style.setProperty('--vvt', `${vv.offsetTop}px`);
  };
  update();
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
}
