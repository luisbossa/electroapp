/* Módulo: procedimientos contratos. Se carga en el orden indicado en index.html. */
    function openProcedimientoModal(id = null) {
      document.getElementById('proc-id').value = '';
      document.getElementById('proc-numero').value = '';
      document.getElementById('proc-descripcion').value = '';
      if (id) {
        const p = procedimientos.find(x => x.id === id);
        if (p) {
          document.getElementById('proc-id').value = p.id;
          document.getElementById('proc-numero').value = p.numero;
          document.getElementById('proc-descripcion').value = p.descripcion;
          document.getElementById('modal-proc-title').innerText = 'Editar Procedimiento Concursal';
        }
      } else {
        document.getElementById('modal-proc-title').innerText = 'Registrar Procedimiento Concursal';
      }
      document.getElementById('modal-procedimiento').classList.remove('hidden');
      lucide.createIcons();
    }

    function saveProcedimiento(e) {
      e.preventDefault();
      const id = document.getElementById('proc-id').value;
      const numero = document.getElementById('proc-numero').value.trim();
      const descripcion = document.getElementById('proc-descripcion').value.trim();

      if (id) {
        const p = procedimientos.find(x => x.id === id);
        if (p) {
          p.numero = numero;
          p.descripcion = descripcion;
        }
      } else {
        procedimientos.push({
          id: Date.now().toString(),
          numero: numero,
          descripcion: descripcion,
          contratos: []
        });
      }
      saveData();
      closeModal('modal-procedimiento');
    }

    function deleteProcedimiento(id) {
      openGenericDeleteModal({
        title:'Eliminar procedimiento',
        message:'¿Está seguro que desea eliminar este procedimiento y <strong>todos sus contratos asociados</strong>?',
        warning:'El procedimiento y sus contratos asociados se eliminarán permanentemente.',
        confirmText:'Eliminar procedimiento',
        onConfirm:()=>{procedimientos=procedimientos.filter(p=>p.id!==id);saveData();}
      });
    }

    function openContratoModal(procId, contratoId = null) {
      document.getElementById('cont-id').value = '';
      document.getElementById('cont-proc-id').value = procId;
      document.getElementById('cont-numero').value = '';
      document.getElementById('cont-nombre').value = '';
      document.getElementById('cont-certificacion').value = '';
      document.getElementById('cont-monto').value = '';
      document.getElementById('cont-moneda').value = '₡';
      document.getElementById('cont-inicio').value = '';
      document.getElementById('cont-fin').value = '';
      document.getElementById('cont-obs').value = '';

      const selProv = document.getElementById('cont-proveedor');
      selProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>';
      proveedores.forEach(prov => {
        selProv.innerHTML += `<option value="${prov.nombre}">${prov.nombre}</option>`;
      });

      if (contratoId) {
        const p = procedimientos.find(x => x.id === procId);
        if (p) {
          const c = p.contratos.find(x => x.id === contratoId);
          if (c) {
            document.getElementById('cont-id').value = c.id;
            document.getElementById('cont-numero').value = c.numero;
            document.getElementById('cont-nombre').value = c.nombre || '';
            document.getElementById('cont-certificacion').value = c.certificacion;
            document.getElementById('cont-proveedor').value = c.proveedor;
            document.getElementById('cont-monto').value = c.monto;
            document.getElementById('cont-moneda').value = c.moneda || '₡';
            document.getElementById('cont-inicio').value = c.inicio;
            document.getElementById('cont-fin').value = c.fin;
            document.getElementById('cont-obs').value = c.observaciones || '';
            document.getElementById('modal-cont-title').innerText = 'Editar Contrato Derivado';
          }
        }
      } else {
        document.getElementById('modal-cont-title').innerText = 'Registrar Contrato Derivado';
      }
      document.getElementById('modal-contrato').classList.remove('hidden');
      lucide.createIcons();
    }

    function saveContrato(e) {
      e.preventDefault();
      const procId = document.getElementById('cont-proc-id').value;
      const contratoId = document.getElementById('cont-id').value;
      const p = procedimientos.find(x => x.id === procId);
      if (!p) return;

      const nuevoContrato = {
        id: contratoId || Date.now().toString(),
        numero: document.getElementById('cont-numero').value.trim(),
        nombre: document.getElementById('cont-nombre').value.trim(),
        certificacion: document.getElementById('cont-certificacion').value.trim(),
        proveedor: document.getElementById('cont-proveedor').value,
        monto: document.getElementById('cont-monto').value,
        moneda: document.getElementById('cont-moneda').value,
        inicio: document.getElementById('cont-inicio').value,
        fin: document.getElementById('cont-fin').value,
        observaciones: document.getElementById('cont-obs').value.trim()
      };

      if (contratoId) {
        const idx = p.contratos.findIndex(c => c.id === contratoId);
        if (idx !== -1) p.contratos[idx] = nuevoContrato;
      } else {
        p.contratos.push(nuevoContrato);
      }
      saveData();
      closeModal('modal-contrato');
    }

    function deleteContrato(procId, contratoId) {
      openGenericDeleteModal({
        title:'Eliminar contrato derivado',
        message:'¿Está seguro que desea eliminar este contrato derivado?',
        warning:'El contrato se eliminará permanentemente.',
        confirmText:'Eliminar contrato',
        onConfirm:()=>{
          const p=procedimientos.find(x=>x.id===procId);
          if(p){p.contratos=p.contratos.filter(c=>c.id!==contratoId);saveData();}
        }
      });
    }

    function verEquiposAmparados(contratoNumero) {
      const tbody = document.getElementById('table-equipos-contrato');
      document.getElementById('modal-eq-cont-title').innerText = `Equipos Amparados al Contrato: ${contratoNumero}`;
      document.getElementById('modal-eq-cont-subtitle').innerText = `Listado oficial de activos médicos vinculados`;
      tbody.innerHTML = '';

      const filtrados = equipos.filter(e => e.numProcedimiento === contratoNumero);

      if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 text-xs italic">No hay equipos médicos vinculados a este contrato actualmente.</td></tr>`;
      } else {
        tbody.innerHTML = filtrados.map(e => `
          <tr class="hover:bg-slate-50 transition">
            <td class="p-3 font-mono font-bold text-blue-600">${e.activo}<br><span class="text-slate-400 font-normal">S/N: ${e.serie || 'N/A'}</span></td>
            <td class="p-3 font-medium text-slate-800">${e.nombre}</td>
            <td class="p-3 text-slate-500">${e.marca || '-'} ${e.modelo || ''}</td>
            <td class="p-3 text-slate-600">${e.ubicacion || 'General'}<br><span class="text-slate-400">${e.sububicacion || '-'}</span></td>
            <td class="p-3"><span class="px-2.5 py-1 rounded-full text-[10px] font-semibold ${e.estado==='Operativo'?'bg-emerald-100 text-emerald-700':e.estado==='En Mantenimiento'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}">${e.estado}</span></td>
          </tr>
        `).join('');
      }

      document.getElementById('modal-equipos-contrato').classList.remove('hidden');
      lucide.createIcons();
    }

    const procedimientosExpandidos = new Set();

    function toggleProcedimiento(id) {
      if (procedimientosExpandidos.has(id)) procedimientosExpandidos.delete(id);
      else procedimientosExpandidos.add(id);
      renderProcedimientosView();
    }

    function estadoVigenciaContrato(c) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fin = c.fin ? new Date(`${c.fin}T00:00:00`) : null;
      if (!fin || Number.isNaN(fin.getTime())) return { texto: 'Sin fecha final', clase: 'bg-slate-100 text-slate-700' };
      const dias = Math.ceil((fin - hoy) / 86400000);
      if (dias < 0) return { texto: 'Vencido', clase: 'bg-red-100 text-red-800' };
      if (dias <= 30) return { texto: `Próximo a vencer (${dias}d)`, clase: 'bg-amber-100 text-amber-800' };
      return { texto: 'Vigente', clase: 'bg-emerald-100 text-emerald-800' };
    }

    function formatFechaContrato(fecha) {
      if (!fecha) return 'No indicada';
      const d = new Date(`${fecha}T00:00:00`);
      return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function abrirDetalleContrato(procId, contratoId) {
      const p = procedimientos.find(x => x.id === procId);
      const c = p?.contratos?.find(x => x.id === contratoId);
      if (!p || !c) return;
      const vigencia = estadoVigenciaContrato(c);
      const asociados = equipos.filter(e => e.numProcedimiento === c.numero);
      const monto = Number.parseFloat(c.monto) || 0;
      document.getElementById('detalle-contrato-procedimiento').textContent = `Procedimiento ${p.numero}`;
      document.getElementById('detalle-contrato-numero').textContent = c.numero;
      document.getElementById('detalle-contrato-nombre').textContent = c.nombre || 'Contrato sin nombre';
      document.getElementById('detalle-contrato-contenido').innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><span class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Estado</span><span class="inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${vigencia.clase}">${vigencia.texto}</span></div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><span class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Monto anual</span><strong class="text-lg text-emerald-700 font-mono">${escapeHTML(c.moneda || '₡')} ${monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><span class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Certificación</span><strong class="text-sm text-blue-700 font-mono">${escapeHTML(c.certificacion || 'No indicada')}</strong></div>
          <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><span class="block text-[10px] uppercase font-bold text-slate-400 mb-1">Equipos amparados</span><strong class="text-lg text-slate-800">${asociados.length}</strong></div>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-5">
          <div class="px-5 py-3 bg-slate-100 border-b border-slate-200"><h4 class="font-bold text-slate-800 text-sm">Información general</h4></div>
          <dl class="grid grid-cols-1 md:grid-cols-2 text-sm">
            <div class="p-4 border-b md:border-r border-slate-200"><dt class="text-[10px] uppercase font-bold text-slate-400">Proveedor adjudicado</dt><dd class="font-semibold text-slate-800 mt-1">${escapeHTML(c.proveedor || 'No indicado')}</dd></div>
            <div class="p-4 border-b border-slate-200"><dt class="text-[10px] uppercase font-bold text-slate-400">Procedimiento de origen</dt><dd class="font-semibold text-slate-800 mt-1">${escapeHTML(p.numero)}</dd></div>
            <div class="p-4 border-b md:border-r border-slate-200"><dt class="text-[10px] uppercase font-bold text-slate-400">Inicio de vigencia</dt><dd class="font-semibold text-slate-800 mt-1">${escapeHTML(formatFechaContrato(c.inicio))}</dd></div>
            <div class="p-4 border-b border-slate-200"><dt class="text-[10px] uppercase font-bold text-slate-400">Fin de vigencia</dt><dd class="font-semibold text-slate-800 mt-1">${escapeHTML(formatFechaContrato(c.fin))}</dd></div>
            <div class="p-4 md:col-span-2"><dt class="text-[10px] uppercase font-bold text-slate-400">Objeto del procedimiento</dt><dd class="text-slate-700 mt-1 leading-relaxed">${escapeHTML(p.descripcion || 'Sin descripción')}</dd></div>
          </dl>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <h4 class="font-bold text-slate-800 text-sm mb-2">Observaciones / Entregables</h4>
          <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">${escapeHTML(c.observaciones || 'No se registraron observaciones para este contrato.')}</p>
        </div>`;
      document.getElementById('detalle-contrato-equipos-btn').onclick = () => verEquiposAmparados(c.numero);
      document.getElementById('detalle-contrato-editar-btn').onclick = () => { closeModal('modal-detalle-contrato'); openContratoModal(p.id, c.id); };
      const modal = document.getElementById('modal-detalle-contrato');
      modal.classList.remove('hidden');
      modal.scrollTop = 0;
      lucide.createIcons();
    }

    function renderProcedimientosView() {
      const container = document.getElementById('procedimientos-container');
      if (!container) return;
      container.innerHTML = '';

      const search = (document.getElementById('procedimientos-search')?.value||'').trim().toLowerCase();
      const filtered = procedimientos.filter(p => {
        const text = `${p.numero} ${p.descripcion} ${p.contratos.map(c => c.numero + ' ' + (c.nombre||'') + ' ' + c.proveedor + ' ' + c.certificacion).join(' ')}`.toLowerCase();
        return text.includes(search);
      });

      if (filtered.length === 0) {
        container.innerHTML = `<div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">No hay procedimientos o contratos registrados.</div>`;
        return;
      }

      filtered.forEach(p => {
        const expandido = procedimientosExpandidos.has(p.id) || (search && p.contratos.some(c => `${c.numero} ${c.nombre || ''} ${c.proveedor || ''} ${c.certificacion || ''}`.toLowerCase().includes(search)));
        const contratosHtml = p.contratos.length ? p.contratos.map(c => {
          const vigencia = estadoVigenciaContrato(c);
          return `<button type="button" onclick="abrirDetalleContrato('${p.id}', '${c.id}')" class="w-full text-left px-4 py-3 bg-white hover:bg-blue-50 border-b border-slate-200 last:border-b-0 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 group">
            <span class="flex items-center gap-3 min-w-0"><span class="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 shrink-0"><i data-lucide="file-text" class="w-4 h-4"></i></span><span class="min-w-0"><strong class="block font-mono text-sm text-slate-900 truncate">${escapeHTML(c.numero)}</strong><span class="block text-xs text-slate-500 truncate">${escapeHTML(c.nombre || 'Contrato sin nombre')} · ${escapeHTML(c.proveedor || 'Proveedor no indicado')}</span></span></span>
            <span class="flex items-center gap-3 shrink-0"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${vigencia.clase}">${vigencia.texto}</span><i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 group-hover:text-blue-600"></i></span>
          </button>`;
        }).join('') : `<p class="text-xs text-slate-400 italic py-5 text-center">No hay contratos derivados registrados para este procedimiento.</p>`;

        container.innerHTML += `
          <div class="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden border-l-4 border-l-blue-600">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
              <div class="flex items-start gap-3 text-left min-w-0 flex-1">
                ${currentUser?.rol === 'invitado' ? '' : `<button type="button"
                  onclick="toggleProcedimiento('${p.id}')"
                  class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shrink-0 transition"
                  aria-expanded="${expandido}"
                  title="${expandido ? 'Ocultar contratos' : 'Ver contratos'}"
                  aria-label="${expandido ? 'Ocultar contratos del procedimiento' : 'Ver contratos del procedimiento'}">
                  <i data-lucide="chevron-${expandido ? 'down' : 'right'}" class="w-5 h-5 pointer-events-none"></i>
                </button>`}
                <button type="button"
                  onclick="toggleProcedimiento('${p.id}')"
                  class="min-w-0 flex-1 text-left"
                  aria-expanded="${expandido}">
                  <span class="min-w-0"><span class="flex flex-wrap items-center gap-2"><strong class="text-blue-950 text-base font-mono">${escapeHTML(p.numero)}</strong><span class="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">${p.contratos.length} ${p.contratos.length === 1 ? 'contrato' : 'contratos'}</span></span><span class="block text-xs text-slate-600 mt-1 leading-relaxed">${escapeHTML(p.descripcion)}</span></span>
                </button>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button onclick="openContratoModal('${p.id}')" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
                  <i data-lucide="plus" class="w-4 h-4"></i> Agregar Contrato
                </button>
                <button onclick="openProcedimientoModal('${p.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition" title="Editar Procedimiento">
                  <i data-lucide="pen-line" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProcedimiento('${p.id}')" class="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-slate-200 transition" title="Eliminar Procedimiento">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
            <div class="${expandido ? '' : 'hidden'} border-t border-slate-200 bg-slate-50 p-3"><div class="bg-white border border-slate-200 rounded-lg overflow-hidden">${contratosHtml}</div></div>
          </div>
        `;
      });
      lucide.createIcons();
    }

    // ==========================================
    // REPORTE DE AVERÍAS Y MTO CORRECTIVO
    // ==========================================
