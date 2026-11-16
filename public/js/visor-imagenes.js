/* Visor de imágenes: al hacer clic en cualquier elemento con [data-visor] que tenga una imagen
   de fondo, la abre en grande. El valor de data-visor se usa como título.
   Clic en la imagen: alterna entre ajustada a la pantalla y tamaño real. ESC o clic fuera: cierra. */
(() => {
  let visor = null;

  function crearVisor() {
    visor = document.createElement('div');
    visor.className = 'visor-imagen';
    visor.setAttribute('role', 'dialog');
    visor.setAttribute('aria-modal', 'true');
    visor.hidden = true;
    visor.innerHTML = `
      <div class="visor-imagen-barra">
        <span class="visor-imagen-titulo"></span>
        <div class="visor-imagen-acciones">
          <button type="button" class="visor-imagen-btn" data-accion="zoom" title="Tamaño real / ajustar">
            <i data-lucide="zoom-in"></i>
          </button>
          <button type="button" class="visor-imagen-btn" data-accion="cerrar" title="Cerrar (Esc)">
            <i data-lucide="x"></i>
          </button>
        </div>
      </div>
      <div class="visor-imagen-lienzo">
        <img alt="" />
      </div>`;
    document.body.appendChild(visor);

    visor.addEventListener('click', (e) => {
      const accion = e.target.closest('[data-accion]')?.dataset.accion;
      if (accion === 'cerrar') return cerrar();
      if (accion === 'zoom' || e.target.tagName === 'IMG') return alternarZoom();
      if (!e.target.closest('.visor-imagen-barra')) cerrar(); // clic en el fondo
    });
    window.lucide?.createIcons();
  }

  function alternarZoom() {
    visor.classList.toggle('ampliada');
  }

  function abrir(src, titulo) {
    if (!visor) crearVisor();
    visor.classList.remove('ampliada');
    visor.querySelector('img').src = src;
    visor.querySelector('img').alt = titulo || 'Imagen';
    visor.querySelector('.visor-imagen-titulo').textContent = titulo || '';
    visor.hidden = false;
    visor.querySelector('[data-accion="cerrar"]').focus();
  }

  function cerrar() {
    if (!visor || visor.hidden) return;
    visor.hidden = true;
    visor.querySelector('img').removeAttribute('src');
  }

  function urlDeFondo(el) {
    const m = (el.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)$/);
    return m ? m[1] : '';
  }

  // Captura: se adelanta a otros clics (p. ej. la tarjeta que abre la ficha del repuesto).
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-visor]');
    if (!el) return;
    const src = urlDeFondo(el);
    if (!src) return;
    e.preventDefault();
    e.stopPropagation();
    abrir(src, el.dataset.visor);
  }, true);

  // ESC cierra el visor sin cerrar la ficha que está debajo.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !visor || visor.hidden) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    cerrar();
  }, true);

  window.abrirVisorImagen = abrir;
})();
