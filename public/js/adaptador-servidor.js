/* Adaptador del servidor local: reemplaza la persistencia y el ingreso basados en localStorage
   por llamadas a la API (/api/...). Debe cargarse al final, después de todos los módulos. */
(() => {
  const API = {
    async json(url, options = {}) {
      const r = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
      const j = await r.json().catch(() => ({}));
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
      currentUser = (await API.login(usuario, password)).usuario;
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
      currentUser = (await API.guest()).usuario;
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
    try { await API.logout(); } catch { /* la sesión local se cierra igualmente */ }
    currentUser = null;
    delete document.body.dataset.userRole;
    showLoginScreen();
  };

  window.onload = async function () {
    initSmartSearches();
    cargandoServidor = true;
    try {
      currentUser = (await API.estado()).usuario || null;
      if (currentUser) {
        await cargarDatosSesion();
        showApplication();
      } else {
        showLoginScreen();
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
