/* Módulo: vistas reportes inicio. Se carga en el orden indicado en index.html. */
    function closeModal(id) {
      const modal = document.getElementById(id);
      if (modal) modal.classList.add('hidden');
    }

    // Cierra con ESC únicamente la ventana visible que esté al frente.
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if (document.querySelector('.swal2-container')) return;
      const abiertas = [...document.querySelectorAll('[id^="modal-"].fixed:not(.hidden)')];
      if (!abiertas.length) return;
      const superior = abiertas
        .map((modal, orden) => ({ modal, orden, z: Number.parseInt(getComputedStyle(modal).zIndex, 10) || 0 }))
        .sort((a, b) => a.z - b.z || a.orden - b.orden)
        .pop().modal;
      e.preventDefault();
      closeModal(superior.id);
    });

    
    


    function exportJSON() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ equipos, bodega, ordenes, movimientos, salidasEquipos, proveedores, averias, procedimientos, cronogramasPreventivos, preventiveContracts, ubicaciones }));
      const dl = document.createElement('a');
      dl.setAttribute("href", dataStr);
      dl.setAttribute("download", "gestion_medica_v51.json");
      dl.click();
    }

    function initConsumoYearSelect() {
      const select = document.getElementById('consumo-year-select');
      if (!select) return;
      const yearsSet = new Set();
      const currentYear = new Date().getFullYear();
      yearsSet.add(currentYear);
      yearsSet.add(currentYear - 1);
      movimientos.forEach(m => {
        if (m.fecha) {
          const y = parseInt(m.fecha.slice(0, 4));
          if (!isNaN(y)) yearsSet.add(y);
        }
      });
      const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);
      const currentSelected = select.value || currentYear.toString();
      select.innerHTML = '';
      sortedYears.forEach(y => select.innerHTML += `<option value="${y}" ${y.toString() === currentSelected ? 'selected' : ''}>Año ${y}</option>`);
    }

    function renderConsumoChart() {
      initConsumoYearSelect();
      const selectYear = document.getElementById('consumo-year-select');
      const selectedYear = selectYear ? selectYear.value : new Date().getFullYear().toString();

      const movsAnio = movimientos.filter(m => m.fecha && m.fecha.startsWith(selectedYear) && (m.tipo || 'Salida') === 'Salida');
      const consumoMap = {};
      bodega.forEach(b => {
        consumoMap[b.nombre] = { nombre: b.nombre, parte: b.parte, categoria: b.categoria || 'General', moneda: b.moneda || '$', costoUnit: b.costo ? parseFloat(b.costo.replace(/[^0-9.-]+/g,"")) : 0, cant: 0, veces: 0 };
      });
      movsAnio.forEach(m => {
        const key = m.repuesto;
        if (!consumoMap[key]) consumoMap[key] = { nombre: key, parte: 'P/N N/A', categoria: 'General', moneda: '$', costoUnit: 0, cant: 0, veces: 0 };
        consumoMap[key].cant += parseInt(m.cant || 1);
        consumoMap[key].veces += 1;
      });

      const sortedConsumo = Object.values(consumoMap).map(item => ({
        nombre: item.nombre, parte: item.parte, categoria: item.categoria, moneda: item.moneda, cantidad: item.cant, intervenciones: item.veces, costoTotal: (item.costoUnit * item.cant).toFixed(2)
      })).sort((a, b) => b.cantidad - a.cantidad);

      const totalUnidades = sortedConsumo.reduce((acc, curr) => acc + curr.cantidad, 0);
      const totalBadge = document.getElementById('chart-total-consumo-badge');
      if (totalBadge) totalBadge.innerText = `${totalUnidades} unidades despachadas en ${selectedYear}`;

      const tbodyConsumo = document.getElementById('table-consumo-anual');
      if (tbodyConsumo) {
        tbodyConsumo.innerHTML = sortedConsumo.map(item => `
          <tr class="hover:bg-slate-50 transition text-xs">
            <td class="p-4 font-semibold text-slate-800"><p class="font-bold text-blue-600">${item.nombre}</p><p class="text-[11px] text-slate-400 font-mono">P/N: ${item.parte}</p></td>
            <td class="p-4 text-slate-600">${item.categoria}</td>
            <td class="p-4 font-bold ${item.cantidad>0?'text-blue-600 font-extrabold':'text-slate-400'}">${item.cantidad} unid.</td>
            <td class="p-4 text-slate-600">${item.intervenciones} despachos</td>
            <td class="p-4 text-right font-bold ${item.costoTotal>0?'text-emerald-700 font-mono':'text-slate-400'}">${item.costoTotal>0 ? item.moneda + ' ' + item.costoTotal : '-'}</td>
          </tr>
        `).join('');
      }

      const ctx = document.getElementById('chartConsumoRepuestos');
      if (!ctx || typeof Chart === 'undefined') return;
      const labels = sortedConsumo.slice(0, 8).map(x => x.nombre.length > 25 ? x.nombre.slice(0, 22) + '...' : x.nombre);
      const dataValues = sortedConsumo.slice(0, 8).map(x => x.cantidad);

      if (consumoChartInstance) consumoChartInstance.destroy();
      try {
        consumoChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['Sin datos'],
            datasets: [{ label: `Unidades (${selectedYear})`, data: dataValues.length ? dataValues : [0], backgroundColor: 'rgba(37, 99, 235, 0.85)', borderRadius: 6 }]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
      } catch (err) {}
    }

    function renderEquiposTable() {
      const search = (document.getElementById('equipos-search')?.value||'').trim().toLowerCase();
      const filterEstado = document.getElementById('filter-estado') ? document.getElementById('filter-estado').value : 'TODOS';
      const filterLoem = document.getElementById('filter-loem') ? document.getElementById('filter-loem').value : 'TODOS';
      const tbodyEq = document.getElementById('table-equipos');
      tbodyEq.innerHTML = '';

      const filteredEq = equipos.filter(e => {
        const matchesLoc = (selectedLocation === 'TODOS' || e.ubicacion === selectedLocation);
        const matchesEst = (filterEstado === 'TODOS' || e.estado === filterEstado);
        
        let loemPct = 0;
        if (e.fechaIngreso && e.loem) {
          const diffAnios = (new Date() - new Date(e.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
          loemPct = Math.min(Math.round((diffAnios / e.loem) * 100), 100);
        }

        let matchesLoem = true;
        if (filterLoem === 'RESTANTE') {
          matchesLoem = loemPct < 80;
        } else if (filterLoem === 'PROXIMO') {
          matchesLoem = loemPct >= 80 && loemPct < 100;
        } else if (filterLoem === 'CUMPLIDA') {
          matchesLoem = loemPct >= 100;
        }

        const matchesSearch = !search ||
          String(e.activo||'').toLowerCase().includes(search) ||
          String(e.nombre||e.descripcion||'').toLowerCase().includes(search) ||
          String(e.descripcion||'').toLowerCase().includes(search);
        return matchesLoc && matchesEst && matchesLoem && matchesSearch;
      });

      document.getElementById('selected-location-title').innerText = selectedLocation;
      document.getElementById('selected-location-badge').innerText = `${filteredEq.length} Equipos mostrados`;
      document.getElementById('loc-kpi-total').innerText = filteredEq.length;
      document.getElementById('loc-kpi-operativos').innerText = filteredEq.filter(e => e.estado === 'Operativo').length;
      document.getElementById('loc-kpi-maint').innerText = filteredEq.filter(e => e.estado === 'En Mantenimiento').length;

      let sedeLoemAlerts = 0;
      filteredEq.forEach(e => {
        if (e.fechaIngreso && e.loem) {
          const diff = (new Date() - new Date(e.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
          if ((diff / e.loem) >= 0.8) sedeLoemAlerts++;
        }
      });
      document.getElementById('loc-kpi-loem').innerText = sedeLoemAlerts;

      if (filteredEq.length === 0) {
        tbodyEq.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400 text-xs">No se encontraron equipos registrados.</td></tr>`;
        return;
      }

      tbodyEq.innerHTML = filteredEq.map(e => {
        let loemPct = 0;
        let diffAnios = 0;
        if (e.fechaIngreso && e.loem) {
          diffAnios = (new Date() - new Date(e.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
          loemPct = Math.min(Math.round((diffAnios / e.loem) * 100), 100);
        }
        const isDanger = loemPct >= 80;

        return `
          <tr class="hover:bg-slate-50 transition text-xs">
            <td class="p-4 font-semibold font-mono"><button onclick="openEquipoModal('${e.id}')" class="text-blue-600 hover:text-blue-800 hover:underline font-bold" title="Abrir ficha del equipo">${e.activo}</button><br><span class="text-slate-400 font-normal">S/N: ${e.serie || 'N/A'}</span></td>
            <td class="p-4 font-medium text-slate-800">${e.nombre}</td>
            <td class="p-4 text-slate-500 font-semibold">${e.marca || '-'}<br><span class="font-normal text-slate-400">${e.modelo || '-'}</span></td>
            <td class="p-4 text-slate-600 font-semibold">${e.ubicacion || 'General'}<br><span class="font-normal text-slate-400">${e.sububicacion || '-'}</span></td>
            <td class="p-4">
              <div class="w-24 space-y-1">
                <span class="text-[10px] font-bold ${isDanger?'text-red-600':'text-slate-600'}">${loemPct}% LOEM</span>
                <div class="progress-bar-bg"><div class="progress-bar-fill ${isDanger?'danger':''}" style="width: ${loemPct}%;"></div></div>
              </div>
            </td>
            <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${e.estado==='Operativo'?'bg-emerald-100 text-emerald-700':e.estado==='En Mantenimiento'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}">${e.estado}</span></td>
            <td class="p-4 text-right space-x-1" onclick="event.stopPropagation()">
              <button onclick="openEquipoModal('${e.id}')" class="text-slate-500 hover:text-blue-600"><i data-lucide="file-text" class="w-4 h-4 inline"></i></button>
              <button onclick="deleteEquipo('${e.id}')" class="text-slate-500 hover:text-red-600"><i data-lucide="trash-2" class="w-4 h-4 inline"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function renderAll() {
updateUbicacionesAdminButton();checkAtrasosSalidas();
      renderLocationTabs();
      renderEquiposTable();
      renderAveriasTable();
      renderProcedimientosView();
      renderCronogramaVisitas();

      const search = (document.getElementById('bodega-search')?.value||'').trim().toLowerCase();

      let vidaUtilAlertCount = 0;
      equipos.forEach(e => {
        if (e.fechaIngreso && e.loem) {
          const diffAnios = (new Date() - new Date(e.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365.25);
          if ((diffAnios / e.loem) >= 0.8) vidaUtilAlertCount++;
        }
      });

      const tbodyBod = document.getElementById('table-bodega');
      const filteredBodega = bodega.filter(b => String(b.nombre||'').toLowerCase().includes(search));
      tbodyBod.innerHTML = filteredBodega.length?filteredBodega.map(b => `
        <tr class="hover:bg-slate-50 transition text-xs">
          <td class="p-4 font-bold"><button onclick="openBodegaModal('${b.id}')" class="text-blue-600 hover:text-blue-800 hover:underline font-bold text-left" title="Abrir ficha del repuesto">${b.nombre}</button><br><span class="font-normal text-slate-400">${b.categoria}</span></td>
          <td class="p-4 font-mono text-slate-500">SAP: ${b.sap || '-'}<br>SICOP: ${b.sicop || '-'}</td>
          <td class="p-4 text-slate-600 font-semibold">${b.estante || '-'}</td>
          <td class="p-4 font-bold ${b.stock<=b.min?'text-red-600':'text-slate-800'}">${b.stock} unid.</td>
          
          <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${b.stock===0?'bg-red-100 text-red-700':b.stock<=b.min?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}">${b.stock===0?'Agotado':b.stock<=b.min?'Stock Bajo':'Disponible'}</span></td>
          <td class="p-4 text-right space-x-1 whitespace-nowrap" onclick="event.stopPropagation()">
            <button onclick="openIngresoBodegaModal('${b.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Registrar ingreso de este repuesto"><i data-lucide="package-plus" class="w-4 h-4 inline"></i></button>
            <button onclick="openSalidaModal('${b.id}')" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Registrar salida de este repuesto"><i data-lucide="arrow-right-left" class="w-4 h-4 inline"></i></button>
            <button onclick="openBodegaModal('${b.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver Ficha Técnica"><i data-lucide="file-text" class="w-4 h-4 inline"></i></button>
            <button onclick="deleteRepuesto('${b.id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar Repuesto"><i data-lucide="trash-2" class="w-4 h-4 inline"></i></button>
          </td>
        </tr>
      `).join(''):`<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">No se encontraron repuestos con esa descripción.</td></tr>`;

      const dashAverias = document.getElementById('dash-averias-list');
      const averiasActivas = averias.filter(a => a.estado !== 'Resuelta / Reparado');
      dashAverias.innerHTML = averiasActivas.length ? averiasActivas.slice(0, 4).map(a => `
        <div class="p-3 bg-red-50/70 border border-red-200 rounded-xl flex justify-between items-center text-xs">
          <div>
            <span class="font-bold text-red-950 font-mono">#${a.numero} — ${a.equipoNombre}</span>
            <p class="text-red-700 text-[11px]">${a.descripcion}</p>
          </div>
          <button onclick="openResolverAveriaModal('${a.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm">Resolver</button>
        </div>
      `).join('') : `<p class="text-xs text-slate-400 italic">No hay reportes de averías pendientes.</p>`;

      const tbodyOT = document.getElementById('table-ot');
      if (tbodyOT) tbodyOT.innerHTML = ordenes.map(o => `
        <tr class="hover:bg-slate-50 text-xs">
          <td class="p-4 font-semibold text-amber-600 font-mono">${o.numero}</td>
          <td class="p-4 font-medium text-slate-800">${o.equipoNombre}</td>
          <td class="p-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600">${o.tipo}</span></td>
          <td class="p-4 text-slate-500">${o.tecnico}<br><span class="text-slate-400">${o.falla}</span></td>
          <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${o.estado==='Abierta'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}">${o.estado}</span></td>
          <td class="p-4 text-right">${o.estado==='Abierta'?`<button onclick="cerrarOT('${o.id}')" class="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs">Cerrar</button>`:`<span class="text-slate-400">Finalizada</span>`}</td>
        </tr>
      `).join('');

      const tbodyMov = document.getElementById('table-movimientos');
      tbodyMov.innerHTML = movimientos.map(m => `
        <tr class="hover:bg-slate-50 text-xs">
          <td class="p-4 text-slate-500 font-mono">${m.fecha}</td>
          <td class="p-4"><span class="px-2.5 py-1 rounded-full font-bold ${(m.tipo||'Salida')==='Ingreso'?'bg-blue-100 text-blue-700':'bg-emerald-100 text-emerald-700'}">${m.tipo||'Salida'}</span>${m.documento?`<br><span class="text-[10px] text-slate-400 font-mono">${m.documento}</span>`:''}</td>
          <td class="p-4 font-medium text-slate-800">${m.repuesto}</td>
          <td class="p-4 font-extrabold ${(m.tipo||'Salida')==='Ingreso'?'text-blue-600':'text-emerald-600'}">${(m.tipo||'Salida')==='Ingreso'?'+':'−'}${m.cant}</td>
          <td class="p-4 text-slate-500">${(m.tipo||'Salida')==='Ingreso'?(m.origen||m.equipo||'-'):(m.equipo||'-')}${m.observaciones?`<br><span class="text-[10px] text-slate-400">${m.observaciones}</span>`:''}</td>
          <td class="p-4 text-slate-500">${m.tecnico}</td>
        </tr>
      `).join('');

      renderConsumoChart();
      renderSalidasEquiposTable();

      const cardsProv = document.getElementById('cards-proveedores');
      const providerSearch=(document.getElementById('proveedores-search')?.value||'').trim().toLowerCase();
      const filteredProviders=proveedores.filter(p=>`${p.nombre||''} ${p.contacto||''} ${p.tel||''} ${p.email||''}`.toLowerCase().includes(providerSearch));
      cardsProv.innerHTML = filteredProviders.length?filteredProviders.map(p => `
        <div class="group bg-white rounded-2xl border border-slate-300 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden relative">
          <div class="h-1.5 bg-gradient-to-r from-blue-700 via-blue-600 to-sky-400"></div>

          <div class="p-5">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                  <i data-lucide="building-2" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 pt-0.5">
                  <p class="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-600 mb-1">Proveedor</p>
                  <h3 class="font-extrabold text-slate-900 text-[15px] leading-5 truncate" title="${escapeHTML(p.nombre || '')}">${escapeHTML(p.nombre || 'Proveedor sin nombre')}</h3>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button onclick="openProvModal('${p.id}')" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition" title="Editar proveedor">
                  <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="deleteProveedor('${p.id}')" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition" title="Eliminar proveedor">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>

            <div class="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 divide-y divide-slate-200">
              <div class="px-3.5 py-3 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <i data-lucide="user-round" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wide font-bold text-slate-400">Contacto</p>
                  <p class="text-xs font-semibold text-slate-700 truncate">${escapeHTML(p.contacto || 'No indicado')}</p>
                </div>
              </div>

              <div class="px-3.5 py-3 grid grid-cols-1 gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                    <i data-lucide="phone" class="w-4 h-4"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-wide font-bold text-slate-400">Teléfono</p>
                    <p class="text-xs font-semibold text-slate-700 truncate">${escapeHTML(p.tel || 'No indicado')}</p>
                  </div>
                </div>

                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                    <i data-lucide="mail" class="w-4 h-4"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-wide font-bold text-slate-400">Correo electrónico</p>
                    <p class="text-xs font-semibold text-slate-700 truncate" title="${escapeHTML(p.email || '')}">${escapeHTML(p.email || 'No indicado')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join(''):`<div class="md:col-span-2 lg:col-span-3 bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">No se encontraron proveedores.</div>`;

      document.getElementById('kpi-total-equipos').innerText = equipos.length;
      document.getElementById('kpi-averias-activas').innerText = averiasActivas.length;
      document.getElementById('kpi-stock-bajo').innerText = bodega.filter(b => b.stock <= b.min).length;
      document.getElementById('kpi-vida-util').innerText = vidaUtilAlertCount;

      document.getElementById('menu-count-equipos').innerText = equipos.length;
      document.getElementById('menu-count-bodega').innerText = bodega.length;
      document.getElementById('menu-count-averias').innerText = averiasActivas.length;
      const otBadge = document.getElementById('menu-count-ot');
      if (otBadge) otBadge.innerText = ordenes.filter(o => o.estado === 'Abierta').length;

      const totalContratosCount = procedimientos.reduce((acc, p) => acc + p.contratos.length, 0);
      const menuBadgeProc = document.getElementById('menu-count-procedimientos');
      if (menuBadgeProc) menuBadgeProc.innerText = totalContratosCount;

      const salidasPendientes = salidasEquipos.filter(s => s.estado !== 'Devuelto' && s.estado !== 'Cancelado').length;
      const badgeSalidas = document.getElementById('menu-count-salida-equipos');
      if (badgeSalidas) badgeSalidas.innerText = salidasPendientes;

      renderUsuarios();
      applyRolePermissions();
      lucide.createIcons();
    }

    window.onload = function() {
      initSmartSearches();
      currentUser = getSessionUser();
      if (currentUser) showApplication();
      else showLoginScreen();
    };
