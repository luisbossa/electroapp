/* Módulo: usuarios, permisos por rol, búsquedas y confirmaciones.
   El ingreso y la sesión están en js/login.js. */
    function saveUsuarios() { localStorage.setItem('EM_v51_usuarios', JSON.stringify(usuarios)); }
    function requireAdmin() { if (!currentUser || currentUser.rol !== 'admin') { alert('Acceso exclusivo para administradores.'); return false; } return true; }
    const GUEST_ALLOWED_TABS = new Set(['equipos','bodega','procedimientos-contratos']);
    const WRITE_ACTION_RE = /^(openAveriaModal|openContratoModal|openCronogramaModal|openDevolucionModal|openIngresoBodegaModal|openPreventiveContractModal|openPreventiveVisit|openProcedimientoModal|openProvModal|openResolverAveriaModal|openSalidaEquipoModal|openSalidaModal|openUsuarioModal|delete|cerrarOT|toggleUsuario|addAvance|toggleCronVisitaItems|resetData|exportJSON|addChipItem|removeChipItem)/;
    function isWriteControl(el){const code=(el?.getAttribute?.('onclick')||'').trim();return WRITE_ACTION_RE.test(code)||/^openEquipoModal\(\s*\)/.test(code)||/^openBodegaModal\(\s*\)/.test(code);}
    function showReadOnlyNotice(){if(window.Swal)Swal.fire({icon:'info',title:'Modo de consulta',text:'Su perfil permite consultar información, pero no crear, editar ni eliminar registros.',confirmButtonText:'Entendido',confirmButtonColor:'#2563EB'});else alert('Su perfil está en modo de consulta y no permite modificar información.');}
    function setPermissionHidden(el,hide,key='permissionHidden'){if(!el)return;if(hide){el.dataset[key]='1';el.style.setProperty('display','none','important');}else if(el.dataset[key]){el.style.removeProperty('display');delete el.dataset[key];}}
    function applyRolePermissions(){
      if(!currentUser)return;const readonly=currentUser.rol!=='admin',guest=currentUser.rol==='invitado';
      document.querySelectorAll('nav .nav-btn').forEach(btn=>{const match=(btn.getAttribute('onclick')||'').match(/changeTab\('([^']+)'/),tab=match?.[1];if(tab)setPermissionHidden(btn,guest&&!GUEST_ALLOWED_TABS.has(tab),'guestHidden');});
      setPermissionHidden(document.getElementById('notifications-button'),guest,'guestHidden');
      document.querySelectorAll('[onclick]').forEach(el=>{if(isWriteControl(el))setPermissionHidden(el,readonly);});
      document.querySelectorAll('form button[type="submit"]').forEach(el=>{if(!el.closest('#login-screen'))setPermissionHidden(el,readonly);});
      setPermissionHidden(document.querySelector('button[onclick*="addChipItem"]'),readonly,'roleChipHidden');
      const chipSearch=document.getElementById('chip-search-input'),chipSelect=document.getElementById('chip-quick-select');
      [chipSearch,chipSelect].forEach(el=>{if(!el)return;if(readonly){el.disabled=true;el.dataset.roleDisabled='1';}else if(el.dataset.roleDisabled){el.disabled=false;delete el.dataset.roleDisabled;}});
      renderChips();
      document.querySelectorAll('[id^="modal-"]:not(.hidden) input, [id^="modal-"]:not(.hidden) select, [id^="modal-"]:not(.hidden) textarea').forEach(el=>{if(readonly){if(!el.disabled){el.disabled=true;el.dataset.roleDisabled='1';}}else if(el.dataset.roleDisabled){el.disabled=false;delete el.dataset.roleDisabled;}});
    }
    document.addEventListener('click',e=>{if(!currentUser||currentUser.rol==='admin')return;const control=e.target.closest('[onclick]');if(control&&isWriteControl(control)){e.preventDefault();e.stopImmediatePropagation();showReadOnlyNotice();}},true);
    document.addEventListener('submit',e=>{if(currentUser&&currentUser.rol!=='admin'&&!e.target.closest('#login-screen')){e.preventDefault();e.stopImmediatePropagation();showReadOnlyNotice();}},true);
    document.addEventListener('click',()=>setTimeout(applyRolePermissions,0));
    function renderUsuarios() {
      const tbody = document.getElementById('table-usuarios'); if (!tbody) return;
      if (!currentUser || currentUser.rol !== 'admin') { tbody.innerHTML=''; return; }
      tbody.innerHTML = usuarios.map(u => {const rolNombre=u.rol==='admin'?'Administrador':u.rol==='invitado'?'Invitado':'Usuario';const rolClase=u.rol==='admin'?'bg-blue-100 text-blue-700':u.rol==='invitado'?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-700';return `<tr class="hover:bg-slate-50 text-xs"><td class="p-4 font-semibold text-slate-800">${escapeHTML(u.nombre)}</td><td class="p-4 font-mono text-blue-700">${escapeHTML(u.usuario)}</td><td class="p-4"><span class="px-2 py-1 rounded-full font-semibold ${rolClase}">${rolNombre}</span></td><td class="p-4"><span class="px-2 py-1 rounded-full font-semibold ${u.activo?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}">${u.activo?'Activo':'Inactivo'}</span></td><td class="p-4 text-right whitespace-nowrap"><button onclick="openUsuarioModal('${u.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button><button onclick="toggleUsuario('${u.id}')" class="p-2 ${u.activo?'text-amber-600':'text-emerald-600'} hover:bg-slate-100 rounded-lg" title="${u.activo?'Desactivar':'Activar'}"><i data-lucide="${u.activo?'user-x':'user-check'}" class="w-4 h-4"></i></button><button onclick="deleteUsuario('${u.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>`;}).join('');
      document.getElementById('users-kpi-total').textContent = usuarios.length;
      document.getElementById('users-kpi-admin').textContent = usuarios.filter(u=>u.rol==='admin').length;
      document.getElementById('users-kpi-active').textContent = usuarios.filter(u=>u.activo).length;
      lucide.createIcons();
    }
    function escapeHTML(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
    function findEquipoBySearch(value='') {
      const q=String(value).trim().toLowerCase();
      return equipos.find(e=>String(e.id)===q||String(e.activo||'').trim().toLowerCase()===q)||null;
    }
    function findRepuestoBySearch(value='') {
      const q=String(value).trim().toLowerCase();
      return bodega.find(b=>String(b.id)===q||String(b.nombre||'').trim().toLowerCase()===q||String(b.parte||'').trim().toLowerCase()===q)||null;
    }
    function fillEquipoDatalist(id,lista=equipos){const dl=document.getElementById(id);if(dl)dl.innerHTML=lista.map(e=>`<option value="${escapeHTML(e.activo)}">${escapeHTML(e.nombre)} · ${escapeHTML(e.ubicacion||'')}</option>`).join('');}
    function fillRepuestoDatalist(id,lista=bodega){const dl=document.getElementById(id);if(dl)dl.innerHTML=lista.map(b=>`<option value="${escapeHTML(b.nombre)}">P/N ${escapeHTML(b.parte||'')} · Stock ${b.stock}</option>`).join('');}
    function initSmartSearches(){
      document.querySelectorAll('[data-smart-search]').forEach(input=>{
        if(input.dataset.smartReady)return;input.dataset.smartReady='1';
        const panel=document.createElement('div');panel.className='smart-search-panel hidden';document.body.appendChild(panel);let matches=[],active=-1;
        const source=()=>input.dataset.smartSearch==='repuesto'?bodega:equipos;
        const valueFor=item=>input.dataset.smartSearch==='repuesto'?(item.nombre||''):(item.activo||'');
        const searchable=item=>input.dataset.smartSearch==='repuesto'?`${item.nombre||''} ${item.parte||''} ${item.categoria||''} ${item.marca||''}`:`${item.activo||''} ${item.serie||''} ${item.nombre||''} ${item.marca||''} ${item.modelo||''} ${item.ubicacion||''}`;
        const position=()=>{const r=input.getBoundingClientRect();panel.style.left=`${r.left}px`;panel.style.top=`${r.bottom+6}px`;panel.style.width=`${Math.max(r.width,300)}px`;};
        const choose=item=>{input.value=valueFor(item);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));panel.classList.add('hidden');};
        const draw=()=>{const q=input.value.trim().toLowerCase();const all=source().filter(x=>!q||searchable(x).toLowerCase().includes(q));matches=all.slice(0,10);active=-1;position();panel.innerHTML=matches.length?`<div class="smart-search-count">${all.length} resultado(s) · continúe escribiendo para precisar</div>`+matches.map((x,i)=>input.dataset.smartSearch==='repuesto'?`<button type="button" class="smart-search-item" data-i="${i}"><span class="smart-search-icon">REP</span><span><div class="smart-search-primary">${escapeHTML(x.nombre||'Sin descripción')}</div><div class="smart-search-secondary">P/N ${escapeHTML(x.parte||'—')} · ${escapeHTML(x.categoria||'General')} · Stock ${x.stock??0}</div></span></button>`:`<button type="button" class="smart-search-item" data-i="${i}"><span class="smart-search-icon">EQ</span><span><div class="smart-search-primary">${escapeHTML(x.activo||'Sin activo')} · ${escapeHTML(x.nombre||'Equipo')}</div><div class="smart-search-secondary">S/N ${escapeHTML(x.serie||'—')} · ${escapeHTML(x.ubicacion||'General')} · ${escapeHTML(x.estado||'')}</div></span></button>`).join(''):`<div class="smart-search-empty">No hay coincidencias. Revise el texto digitado.</div>`;panel.classList.remove('hidden');panel.querySelectorAll('.smart-search-item').forEach(btn=>btn.addEventListener('mousedown',e=>{e.preventDefault();choose(matches[Number(btn.dataset.i)]);}));};
        input.addEventListener('focus',draw);input.addEventListener('input',draw);
        input.addEventListener('keydown',e=>{if(panel.classList.contains('hidden'))return;const items=[...panel.querySelectorAll('.smart-search-item')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopImmediatePropagation();active=Math.max(0,Math.min(items.length-1,active+(e.key==='ArrowDown'?1:-1)));items.forEach((el,i)=>el.classList.toggle('active',i===active));items[active]?.scrollIntoView({block:'nearest'});}else if(e.key==='Enter'&&active>=0){e.preventDefault();e.stopImmediatePropagation();choose(matches[active]);}else if(e.key==='Escape'){e.stopPropagation();panel.classList.add('hidden');}},true);
        input.addEventListener('blur',()=>setTimeout(()=>panel.classList.add('hidden'),140));window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
      });
    }
    function openUsuarioModal(id=null) {
      if (!requireAdmin()) return; const u = id ? usuarios.find(x=>x.id===id) : null;
      document.getElementById('usr-id').value = u?.id || ''; document.getElementById('usr-nombre').value = u?.nombre || ''; document.getElementById('usr-usuario').value = u?.usuario || ''; document.getElementById('usr-password').value=''; document.getElementById('usr-rol').value=u?.rol||'usuario'; document.getElementById('usr-activo').value=String(u?.activo ?? true);
      document.getElementById('usr-password').required=!u; document.getElementById('usr-pass-help').textContent=u?'(dejar vacío para conservarla)':'*'; document.getElementById('usuario-modal-title').textContent=u?'Editar Usuario':'Nuevo Usuario'; document.getElementById('usuario-form-error').classList.add('hidden'); document.getElementById('modal-usuario').classList.remove('hidden'); lucide.createIcons();
    }
    function closeUsuarioModal() { document.getElementById('modal-usuario').classList.add('hidden'); }
    function saveUsuario(e) {
      e.preventDefault(); if (!requireAdmin()) return; const id=document.getElementById('usr-id').value; const nombre=document.getElementById('usr-nombre').value.trim(); const usuario=document.getElementById('usr-usuario').value.trim(); const password=document.getElementById('usr-password').value; const rol=document.getElementById('usr-rol').value; const activo=document.getElementById('usr-activo').value==='true'; const err=document.getElementById('usuario-form-error');
      if (usuarios.some(u=>u.usuario.toLowerCase()===usuario.toLowerCase() && u.id!==id)) { err.textContent='Ese nombre de usuario ya existe.'; err.classList.remove('hidden'); return; }
      if (!id && !password) { err.textContent='La contraseña es obligatoria para usuarios nuevos.'; err.classList.remove('hidden'); return; }
      if (id) { const idx=usuarios.findIndex(u=>u.id===id); if(idx<0)return; const old=usuarios[idx]; if(old.id===currentUser.id && (!activo || rol!=='admin')) { err.textContent='No puedes quitarte a ti mismo el acceso de administrador mientras tienes la sesión iniciada.'; err.classList.remove('hidden'); return; } usuarios[idx]={...old,nombre,usuario,rol,activo,password:password||old.password}; if(currentUser.id===id) currentUser=usuarios[idx]; } else usuarios.push({id:'usr-'+Date.now(),nombre,usuario,password,rol,activo});
      saveUsuarios(); closeUsuarioModal(); renderUsuarios(); showApplication();
    }
    function toggleUsuario(id) { if(!requireAdmin())return; const u=usuarios.find(x=>x.id===id); if(!u)return; if(u.id===currentUser.id){alert('No puedes desactivar tu propia cuenta mientras estás conectado.');return;} u.activo=!u.activo; saveUsuarios(); renderUsuarios(); }
    
    let pendingGenericDeleteAction = null;

    function openGenericDeleteModal({title='Confirmar eliminación', message='', warning='El registro se eliminará permanentemente.', confirmText='Eliminar', onConfirm=null}) {
      pendingGenericDeleteAction = onConfirm;
      const modal = document.getElementById('modal-eliminar-generico');
      if (!modal) return;
      document.getElementById('delete-generic-title').textContent = title;
      document.getElementById('delete-generic-message').innerHTML = message;
      document.getElementById('delete-generic-warning').textContent = warning;
      const btn = document.getElementById('delete-generic-confirm-btn');
      btn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i> ' + confirmText;
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (window.lucide) lucide.createIcons();
    }

    function closeGenericDeleteModal() {
      const modal = document.getElementById('modal-eliminar-generico');
      if (modal) modal.classList.add('hidden');
      pendingGenericDeleteAction = null;
      document.body.classList.remove('overflow-hidden');
    }

    function confirmGenericDelete() {
      const action = pendingGenericDeleteAction;
      closeGenericDeleteModal();
      if (typeof action === 'function') action();
    }

function deleteUsuario(id) {
      if(!requireAdmin()) return;
      const u=usuarios.find(x=>x.id===id);
      if(!u) return;
      if(u.id===currentUser.id){
        Swal.fire({icon:'info', title:'Cuenta en uso', text:'No puedes eliminar tu propia cuenta mientras estás conectado.', confirmButtonText:'Entendido'});
        return;
      }
      if(u.usuario==='admin'){
        Swal.fire({icon:'warning', title:'Usuario protegido', text:'El usuario administrador principal no se puede eliminar.', confirmButtonText:'Entendido'});
        return;
      }
      openGenericDeleteModal({
        title:'Eliminar usuario',
        message:`¿Eliminar al usuario <strong>${escapeHTML(u.usuario)}</strong>?`,
        warning:'La cuenta del usuario se eliminará permanentemente.',
        confirmText:'Eliminar usuario',
        onConfirm:()=>{usuarios=usuarios.filter(x=>x.id!==id);saveUsuarios();renderUsuarios();}
      });
    }

    // CRONOGRAMAS DE MANTENIMIENTO PREVENTIVO - PLANIFICACIÓN OPERATIVA
    const CRON_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Setiembre','Octubre','Noviembre','Diciembre'];
    const CRON_ESTADOS = ['Pendiente','Programada','Realizada','Parcial','Vencida'];
