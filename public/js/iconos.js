/* Iconos Lucide: dibuja automáticamente cualquier <i data-lucide="..."> que aparezca en la página.
   Evita iconos vacíos cuando un módulo inserta HTML y olvida llamar a lucide.createIcons(). */
(() => {
  const PENDIENTES = '[data-lucide]:not(svg)';
  let programado = false;

  function refreshIcons() {
    if (!window.lucide?.createIcons) return;
    if (!document.querySelector(PENDIENTES)) return; // nada nuevo que dibujar
    window.lucide.createIcons();
  }

  function programarIconos() {
    if (programado) return;
    programado = true;
    requestAnimationFrame(() => { programado = false; refreshIcons(); });
  }

  window.refreshIcons = refreshIcons;

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.lucide) {
      console.error('No se cargó la librería de iconos Lucide. Revise la conexión al CDN.');
      return;
    }
    refreshIcons();
    new MutationObserver(programarIconos).observe(document.body, { childList: true, subtree: true });
  });
})();
