/* Adaptador del servidor local: reemplaza la persistencia y el ingreso basados en localStorage
   por llamadas a la API (/api/...). Debe cargarse al final, después de todos los módulos. */
(() => {
  const API = {
    async json(url, options = {}) {
      const r = await fetch(url, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
      const j = await r.json().catch(() => ({}));
      if (r.status === 401 && j.sesionExpirada && currentUser) sesionVencida('Su sesión expiró. Ingrese nuevamente.');
      if (!r.ok) throw new Error(j.mensaje || `Error ${r.status}`);
      return j;
    },
    estado() { return this.json('/api/estado'); },
    login(usuario, password) { return this.json('/api/login', { method: 'POST', body: JSON.stringify({ cuenta: usuario, clave: password }) }); },
    guest() { return this.json('/api/invitado', { method: 'POST', body: '{}' }); },
    logout() { return this.json('/api/logout', { method: 'POST', body: '{}' }); },
    datos() { return this.json('/api/datos'); },
    guardar(s) { return this.json('/api/datos', { method: 'PUT', body: JSON.stringify(s) }); },
    usuarios() { return this.json('/api/usuarios'); },
    syncUsuarios(u) { return this.json('/api/usuarios/sync', { method: 'PUT', body: JSON.stringify({ usuarios: u }) }); }
  };

  /* Versiones locales originales: se restauran si el servidor no responde (modo local). */
  const local = { saveData, saveCronogramasData, savePreventiveContracts, saveUsuarios, getSessionUser, loginUser, loginAsGuest, logoutUser };
  function activarModoLocal() {
    ({ saveData, saveCronogramasData, savePreventiveContracts, saveUsuarios, getSessionUser, loginUser, loginAsGuest, logoutUser } = local);
  }

  /* ---------- Persistencia ---------- */
  let timerServidor = null, cargandoServidor = false;

  function snapshot() {
    return { equipos, bodega, ordenes, movimientos, salidasEquipos, proveedores, averias, procedimientos, cronogramasPreventivos, preventiveContracts, ubicaciones };
  }
  function aplicar(s) {
    if (!s || typeof s !== 'object') return;
    equipos = s.equipos || equipos; bodega = s.bodega || bodega; ordenes = s.ordenes || ordenes;
    movimientos = s.movimientos || movimientos; salidasEquipos = s.salidasEquipos || salidasEquipos;
    proveedores = s.proveedores || proveedores; averias = s.averias || averias; procedimientos = s.procedimientos || procedimientos;
    cronogramasPreventivos = s.cronogramasPreventivos || cronogramasPreventivos;
    preventiveContracts = s.preventiveContracts || preventiveContracts; ubicaciones = s.ubicaciones || ubicaciones;
  }

  const saveLocal = saveData;
  saveData = function () {
    saveLocal();
    if (cargandoServidor) return;
    clearTimeout(timerServidor);
    timerServidor = setTimeout(() => API.guardar(snapshot()).catch(e => console.error('No se pudo guardar en servidor:', e)), 180);
  };
  saveCronogramasData = function () { localStorage.setItem('EM_v51_cronogramas_preventivos', JSON.stringify(cronogramasPreventivos)); saveData(); };
  savePreventiveContracts = function () { localStorage.setItem('EM_v51_preventive_contracts', JSON.stringify(preventiveContracts)); saveData(); };
  saveUsuarios = function () {
    localStorage.setItem('EM_v51_usuarios', JSON.stringify(usuarios.map(u => ({ ...u, password: undefined }))));
    API.syncUsuarios(usuarios).then(r => { usuarios = r.usuarios || usuarios; renderUsuarios(); }).catch(e => alert(e.message));
  };

  /* ---------- Cierre de sesión por inactividad ---------- */
  // La última actividad se comparte entre pestañas (localStorage) para no cerrar una pestaña
  // mientras el usuario trabaja en otra. El servidor también valida la inactividad.
  const CLAVE_ACTIVIDAD = 'gem-ultima-actividad';
  const AVISAR_SERVIDOR_MS = 2 * 60 * 1000;
  let inactividadMs = 30 * 60 * 1000, ultimaActividad = Date.now(), ultimoAviso = 0, vigilando = false, timerVigilancia = null;

  function leerActividadCompartida() {
    try { return Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || 0; } catch { return 0; }
  }
  function registrarActividad() {
    if (!vigilando) return;
    const ahora = Date.now();
    if (ahora - ultimaActividad < 1000) return;
    ultimaActividad = ahora;
    try { localStorage.setItem(CLAVE_ACTIVIDAD, String(ahora)); } catch { /* sin almacenamiento */ }
    // Mantiene viva la sesión en el servidor mientras se usa la aplicación, aunque no se guarde nada.
    if (ahora - ultimoAviso > AVISAR_SERVIDOR_MS) { ultimoAviso = ahora; API.estado().catch(() => {}); }
  }
  function revisarInactividad() {
    if (!vigilando) return;
    const ultima = Math.max(ultimaActividad, leerActividadCompartida());
    if (Date.now() - ultima >= inactividadMs) sesionVencida('Su sesión se cerró por inactividad. Ingrese nuevamente.');
  }
  function iniciarVigilancia(ms) {
    if (Number(ms) > 0) inactividadMs = Number(ms);
    ultimaActividad = ultimoAviso = Date.now();
    try { localStorage.setItem(CLAVE_ACTIVIDAD, String(ultimaActividad)); } catch { /* sin almacenamiento */ }
    vigilando = true;
    clearInterval(timerVigilancia);
    timerVigilancia = setInterval(revisarInactividad, 15 * 1000);
  }
  function detenerVigilancia() {
    vigilando = false;
    clearInterval(timerVigilancia);
  }
  function sesionVencida(mensaje) {
    if (!currentUser) return;
    detenerVigilancia();
    API.logout().catch(() => {});
    currentUser = null;
    delete document.body.dataset.userRole;
    document.querySelectorAll('[id^="modal-"].fixed:not(.hidden)').forEach(m => m.classList.add('hidden'));
    if (window.Swal?.isVisible()) Swal.close();
    showLoginScreen();
    setLoginError(mensaje, 'info');
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove'].forEach(evento =>
    document.addEventListener(evento, registrarActividad, { passive: true, capture: true }));
  // Los temporizadores se pausan en pestañas ocultas: se revisa al volver a la pestaña.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) revisarInactividad(); });
  window.addEventListener('focus', revisarInactividad);

  /* ---------- Sesión ---------- */
  async function cargarDatosSesion() {
    const d = await API.datos();
    aplicar(d.datos);
    if (currentUser.rol === 'admin') {
      try { usuarios = (await API.usuarios()).usuarios || usuarios; } catch { /* sin permiso o sin datos */ }
    }
  }

  getSessionUser = function () { return currentUser; };

  loginUser = async function (e) {
    e.preventDefault();
    const usuario = document.getElementById('login-usuario').value.trim();
    const password = document.getElementById('login-password').value;
    setLoginBusy(true);
    try {
      const r = await API.login(usuario, password);
      currentUser = r.usuario;
      iniciarVigilancia(r.inactividadMs);
      clearLoginError();
      cargandoServidor = true;
      await cargarDatosSesion();
      showLoginSuccess(currentUser.nombre || currentUser.usuario || usuario);
    } catch (ex) {
      setLoginError(ex.message);
    } finally {
      cargandoServidor = false;
      setLoginBusy(false);
    }
  };

  loginAsGuest = async function () {
    setLoginBusy(true);
    try {
      const r = await API.guest();
      currentUser = r.usuario;
      iniciarVigilancia(r.inactividadMs);
      clearLoginError();
      cargandoServidor = true;
      await cargarDatosSesion();
      showApplication();
    } catch (ex) {
      setLoginError(ex.message);
    } finally {
      cargandoServidor = false;
      setLoginBusy(false);
    }
  };

  logoutUser = async function () {
    detenerVigilancia();
    try { await API.logout(); } catch { /* la sesión local se cierra igualmente */ }
    currentUser = null;
    delete document.body.dataset.userRole;
    showLoginScreen();
  };

  window.onload = async function () {
    initSmartSearches();
    cargandoServidor = true;
    try {
      const estado = await API.estado();
      currentUser = estado.usuario || null;
      if (currentUser) {
        iniciarVigilancia(estado.inactividadMs);
        await cargarDatosSesion();
        showApplication();
      } else {
        showLoginScreen();
        if (estado.sesionExpirada) setLoginError('Su sesión se cerró por inactividad. Ingrese nuevamente.', 'info');
      }
    } catch (e) {
      console.warn('Servidor no disponible; se usa el modo local.', e);
      activarModoLocal();
      currentUser = getSessionUser();
      if (currentUser) { showApplication(); return; }
      showLoginScreen();
      setLoginError('Sin conexión al servidor: modo local. Los datos se guardan solo en este navegador.', 'info');
    } finally {
      cargandoServidor = false;
    }
  };
})();
