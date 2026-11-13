/* Módulo: navegacion ubicaciones. Se carga en el orden indicado en index.html. */
    function showBodegaSection(section = 'inventario') {
      const showConsumo = section === 'consumo';
      const inventoryPanel = document.getElementById('bodega-inventario-panel');
      const consumptionPanel = document.getElementById('bodega-consumo-panel');
      const inventoryTab = document.getElementById('bodega-tab-inventario');
      const consumptionTab = document.getElementById('bodega-tab-consumo');
      if (!inventoryPanel || !consumptionPanel) return;

      inventoryPanel.classList.toggle('hidden', showConsumo);
      consumptionPanel.classList.toggle('hidden', !showConsumo);
      inventoryTab.className = `bodega-section-tab px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${showConsumo ? 'text-slate-500 hover:text-emerald-700' : 'bg-white text-emerald-700 shadow-sm'}`;
      consumptionTab.className = `bodega-section-tab px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${showConsumo ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-blue-700'}`;
      inventoryTab.setAttribute('aria-selected', String(!showConsumo));
      consumptionTab.setAttribute('aria-selected', String(showConsumo));
      if (showConsumo) setTimeout(renderConsumoChart, 60);
      if (window.lucide) lucide.createIcons();
    }

    // NAVEGACIÓN
    function changeTab(tabName, element) {
      if (tabName === 'usuarios' && (!currentUser || currentUser.rol !== 'admin')) { alert('Acceso exclusivo para administradores.'); return; }
      if (currentUser?.rol === 'invitado' && !GUEST_ALLOWED_TABS.has(tabName)) { showReadOnlyNotice(); return; }
      document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
      const targetView = document.getElementById('view-' + tabName);
      if (targetView) targetView.classList.remove('hidden');
      if (element) element.classList.add('active');

      if (tabName === 'bodega') showBodegaSection('inventario');
      if (tabName === 'Cronogramas Mantenimiento Preventivo') { setTimeout(renderCronogramaVisitas, 20); }
    }

    // PESTAÑAS DE UBICACIÓN
    function renderLocationTabs() {
      const locations = ["TODOS", ...ubicaciones];
      const container = document.getElementById('location-tabs-container');
      if (!container) return;
      container.innerHTML = '';

      locations.forEach(loc => {
        const activeClass = (selectedLocation === loc) ? 'active' : '';
        container.innerHTML += `
          <button data-location="${escapeHTML(loc)}" onclick="selectLocation(this.dataset.location)" class="location-tab ${activeClass} text-xs px-3 py-1.5 rounded-lg border transition font-medium">
            ${escapeHTML(loc)}
          </button>
        `;
      });
    }

    function selectLocation(loc) {
      selectedLocation = loc;
      renderLocationTabs();
      renderEquiposTable();
    }

    function refreshUbicacionSelect(selected = '') {
      const select = document.getElementById('eq-ubicacion');
      if (!select) return;
      const value = selected || select.value || 'SEDE CENTRAL';
      select.innerHTML = ubicaciones.map(loc => `<option value="${escapeHTML(loc)}">${escapeHTML(loc)}</option>`).join('');
      if (value && !ubicaciones.includes(value)) {
        ubicaciones.push(value);
        localStorage.setItem('EM_v51_ubicaciones', JSON.stringify(ubicaciones));
        select.innerHTML += `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`;
      }
      select.value = value;
    }


    // ADMINISTRACIÓN DE UBICACIONES
    function canManageUbicaciones() {
      return !!currentUser && currentUser.rol === 'admin';
    }

    function updateUbicacionesAdminButton() {
      const btn = document.getElementById('btn-admin-ubicaciones');
      if (!btn) return;
      btn.classList.toggle('hidden', !canManageUbicaciones());
    }

    function normalizeUbicacionName(value) {
      return String(value || '').trim().replace(/\s+/g, ' ');
    }

    function openUbicacionesManager() {
      if (!canManageUbicaciones()) {
        Swal.fire({icon:'warning', title:'Acceso restringido', text:'Solo un administrador puede modificar las ubicaciones.'});
        return;
      }
      renderUbicacionesManager();
      const modal = document.getElementById('modal-ubicaciones');
      modal?.classList.remove('hidden');
      setTimeout(() => document.getElementById('nueva-ubicacion-input')?.focus(), 50);
      lucide.createIcons();
    }

    function closeUbicacionesManager() {
      document.getElementById('modal-ubicaciones')?.classList.add('hidden');
      const input = document.getElementById('nueva-ubicacion-input');
      if (input) input.value = '';
    }

    function renderUbicacionesManager() {
      const list = document.getElementById('ubicaciones-manager-list');
      const count = document.getElementById('ubicaciones-manager-count');
      if (!list) return;
      if (count) count.textContent = `${ubicaciones.length} ubicaciones`;

      list.innerHTML = ubicaciones.map((loc, index) => {
        const total = equipos.filter(e => e.ubicacion === loc).length;
        return `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white">
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-800 break-words">${escapeHTML(loc)}</p>
              <p class="text-xs text-slate-500 mt-0.5">${total} equipo${total === 1 ? '' : 's'} asignado${total === 1 ? '' : 's'}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button type="button" data-index="${index}" onclick="editUbicacionGestion(Number(this.dataset.index))"
                class="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="pencil" class="w-3.5 h-3.5"></i> Modificar
              </button>
              <button type="button" data-index="${index}" onclick="deleteUbicacionGestion(Number(this.dataset.index))"
                class="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Eliminar
              </button>
            </div>
          </div>`;
      }).join('');

      lucide.createIcons();
    }

    async function addUbicacionGestion() {
      if (!canManageUbicaciones()) return;
      const input = document.getElementById('nueva-ubicacion-input');
      const nombre = normalizeUbicacionName(input?.value);
      if (!nombre) {
        await Swal.fire({icon:'info', title:'Nombre requerido', text:'Digite el nombre de la nueva ubicación.'});
        input?.focus();
        return;
      }
      if (ubicaciones.some(u => u.toLocaleLowerCase() === nombre.toLocaleLowerCase())) {
        await Swal.fire({icon:'warning', title:'Ubicación existente', text:'Ya existe una ubicación con ese nombre.'});
        return;
      }

      ubicaciones.push(nombre);
      saveData();
      if (input) input.value = '';
      renderUbicacionesManager();
      renderLocationTabs();
      refreshUbicacionSelect();
      await Swal.fire({icon:'success', title:'Ubicación agregada', text:`"${nombre}" fue agregada correctamente.`, timer:1400, showConfirmButton:false});
    }

    async function editUbicacionGestion(index) {
      if (!canManageUbicaciones()) return;
      const anterior = ubicaciones[index];
      if (!anterior) return;

      const result = await Swal.fire({
        title: 'Modificar ubicación',
        html: `<div class="text-left text-sm text-slate-600 mb-2">Nombre actual: <strong>${escapeHTML(anterior)}</strong></div>`,
        input: 'text',
        inputValue: anterior,
        inputAttributes: { maxlength: 80, autocapitalize: 'words' },
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2563EB',
        preConfirm: value => {
          const nuevo = normalizeUbicacionName(value);
          if (!nuevo) {
            Swal.showValidationMessage('El nombre de la ubicación no puede quedar vacío.');
            return false;
          }
          if (ubicaciones.some((u, i) => i !== index && u.toLocaleLowerCase() === nuevo.toLocaleLowerCase())) {
            Swal.showValidationMessage('Ya existe otra ubicación con ese nombre.');
            return false;
          }
          return nuevo;
        }
      });

      if (!result.isConfirmed) return;
      const nuevo = result.value;
      if (nuevo === anterior) return;

      // Mantiene la relación con los equipos ya registrados.
      equipos.forEach(eq => {
        if (eq.ubicacion === anterior) eq.ubicacion = nuevo;
      });

      // Mantiene referencias de ubicación en planes preventivos, si existen.
      cronogramasPreventivos.forEach(plan => {
        if (plan.ubicacion === anterior) plan.ubicacion = nuevo;
      });

      ubicaciones[index] = nuevo;
      if (selectedLocation === anterior) selectedLocation = nuevo;

      saveData();
      renderUbicacionesManager();
      renderLocationTabs();
      renderEquiposTable();
      refreshUbicacionSelect(nuevo);

      await Swal.fire({icon:'success', title:'Ubicación actualizada', text:`"${anterior}" ahora se llama "${nuevo}".`, timer:1600, showConfirmButton:false});
    }

    function deleteUbicacionGestion(index) {
      if (!canManageUbicaciones()) return;
      const nombre = ubicaciones[index];
      if (!nombre) return;
      const asociados = equipos.filter(e => e.ubicacion === nombre).length;
      if (asociados > 0) {
        Swal.fire({icon:'warning',title:'No se puede eliminar',html:`La ubicación <strong>${escapeHTML(nombre)}</strong> tiene <strong>${asociados}</strong> equipo${asociados === 1 ? '' : 's'} asignado${asociados === 1 ? '' : 's'}.<br><br>Reasigne primero esos equipos a otra ubicación.`});
        return;
      }
      openGenericDeleteModal({
        title:'Eliminar ubicación',
        message:`¿Desea eliminar definitivamente <strong>${escapeHTML(nombre)}</strong>?`,
        warning:'La ubicación se eliminará permanentemente del sistema.',
        confirmText:'Eliminar ubicación',
        onConfirm:()=>{
          ubicaciones.splice(index,1);
          if(selectedLocation===nombre) selectedLocation='TODOS';
          saveData(); renderUbicacionesManager(); renderLocationTabs(); renderEquiposTable(); refreshUbicacionSelect();
          Swal.fire({icon:'success',title:'Ubicación eliminada',text:`"${nombre}" fue eliminada correctamente.`,timer:1400,showConfirmButton:false});
        }
      });
    }

