/* Impresión de ventanas (expedientes, fichas...).
   imprimirVentana(this) imprime solo la ventana que contiene el botón, completa y sin recortes.
   Las reglas de página están en public/css/impresion.css. */
(() => {
  function limpiar() {
    document.body.classList.remove('imprimiendo-ventana');
    document.querySelectorAll('.area-impresion').forEach(el => el.classList.remove('area-impresion'));
  }

  window.imprimirVentana = function (origen) {
    const ventana = origen?.closest?.('[id^="modal-"].fixed');
    limpiar();
    if (ventana) {
      ventana.classList.add('area-impresion');
      document.body.classList.add('imprimiendo-ventana');
    }
    window.print();
    // Algunos navegadores vuelven de print() antes de imprimir: se limpia también en afterprint.
    setTimeout(limpiar, 0);
  };

  window.addEventListener('afterprint', limpiar);
})();
