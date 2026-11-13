/* Módulo: pantalla de ingreso y sesión.
   Versión local (localStorage). js/adaptador-servidor.js reemplaza loginUser, loginAsGuest,
   logoutUser y getSessionUser por sus equivalentes con la API, reutilizando estas utilidades. */

const GUEST_ACCESS_USER = { id: 'guest-public-access', nombre: 'Invitado', usuario: 'invitado', rol: 'invitado', activo: true };
const SESSION_KEY = 'v51_session_user';
const ROLE_LABELS = { admin: 'Administrador', invitado: 'Invitado · Consulta' };

/* ---------- Utilidades de la pantalla de ingreso ---------- */
const loginEl = id => document.getElementById(id);

/** Muestra un mensaje en el formulario. tipo: 'error' (rojo) o 'info' (azul). */
function setLoginError(message, tipo = 'error') {
  const err = loginEl('login-error');
  if (!err) return;
  err.querySelector('span').textContent = message;
  err.classList.toggle('login-error--info', tipo === 'info');
  err.classList.toggle('hidden', !message);
}

function clearLoginError() { setLoginError(''); }

/** Deshabilita los botones mientras se valida el ingreso y evita envíos dobles. */
function setLoginBusy(busy) {
  const screen = loginEl('login-screen');
  if (!screen) return;
  screen.classList.toggle('is-busy', busy);
  screen.querySelectorAll('button').forEach(btn => { btn.disabled = busy; });
}

function showLoginScreen() {
  const screen = loginEl('login-screen');
  screen.classList.remove('hidden');
  loginEl('login-password').value = '';
  setLoginBusy(false);
  loginEl('login-usuario').focus();
}

function toggleLoginPassword() {
  const input = loginEl('login-password');
  const button = loginEl('login-toggle-password');
  if (!input) return;
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  button?.setAttribute('aria-pressed', String(visible));
  button?.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
}

/* ---------- Sesión local ---------- */
function getSessionUser() {
  try {
    const id = sessionStorage.getItem(SESSION_KEY);
    if (id === GUEST_ACCESS_USER.id) return { ...GUEST_ACCESS_USER };
    return usuarios.find(u => u.id === id && u.activo) || null;
  } catch (e) { return null; }
}

function loginUser(e) {
  e.preventDefault();
  const usuario = loginEl('login-usuario').value.trim().toLowerCase();
  const password = loginEl('login-password').value;
  const found = usuarios.find(u => u.usuario.toLowerCase() === usuario && u.password === password && u.activo);
  if (!found) { setLoginError('Usuario o contraseña incorrectos, o la cuenta está inactiva.'); return; }
  currentUser = found;
  sessionStorage.setItem(SESSION_KEY, found.id);
  clearLoginError();
  showLoginSuccess(found.nombre || found.usuario);
}

function loginAsGuest() {
  currentUser = { ...GUEST_ACCESS_USER };
  sessionStorage.setItem(SESSION_KEY, GUEST_ACCESS_USER.id);
  clearLoginError();
  showApplication();
}

function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  delete document.body.dataset.userRole;
  showLoginScreen();
}

/* ---------- Transición a la aplicación ---------- */
function showApplication() {
  if (!currentUser) return;
  const nombre = currentUser.nombre || currentUser.usuario || 'Usuario';
  loginEl('login-screen').classList.add('hidden');
  setLoginBusy(false);
  loginEl('session-name').textContent = nombre;
  loginEl('session-role').textContent = ROLE_LABELS[currentUser.rol] || 'Usuario · Solo lectura';
  loginEl('session-avatar').textContent = nombre.trim().charAt(0).toUpperCase();
  loginEl('nav-usuarios').classList.toggle('hidden', currentUser.rol !== 'admin');
  document.body.dataset.userRole = currentUser.rol || 'usuario';
  renderUsuarios();
  renderAll();
  changeTab('equipos', loginEl('nav-equipos'));
  applyRolePermissions();
  window.refreshIcons?.();
}

/** Muestra la aplicación y, solo para cuentas con credenciales, un aviso de bienvenida. */
function showLoginSuccess(nombre) {
  showApplication();
  if (!currentUser || currentUser.rol === 'invitado' || currentUser.rol === 'visualizador') return;
  const toast = loginEl('login-welcome-toast');
  const text = loginEl('login-welcome-text');
  if (!toast || !text) return;
  text.textContent = `Bienvenido ${nombre || currentUser.nombre || currentUser.usuario || 'Usuario'}`;
  toast.classList.remove('hidden', 'login-welcome-hide');
  toast.classList.add('login-welcome-show');
  clearTimeout(window.__loginWelcomeTimer);
  window.__loginWelcomeTimer = setTimeout(() => {
    toast.classList.replace('login-welcome-show', 'login-welcome-hide');
    setTimeout(() => toast.classList.add('hidden'), 260);
  }, 2200);
}
