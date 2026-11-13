/* Módulo: salidas. Se carga en el orden indicado en index.html. */
    function openSalidaModal(repuestoId = null) {
      const repuesto = repuestoId ? bodega.find(b => b.id === repuestoId) : null;
      document.getElementById('salida-repuesto').value=repuesto?.nombre||'';document.getElementById('salida-equipo').value='';fillRepuestoDatalist('salida-repuesto-list');fillEquipoDatalist('salida-equipo-list');
      document.getElementById('modal-salida').classList.remove('hidden');
    }

    function saveSalida(e) {
      e.preventDefault();
      const item = findRepuestoBySearch(document.getElementById('salida-repuesto').value);
      const destino = findEquipoBySearch(document.getElementById('salida-equipo').value);
      if(!item){alert('Digite y seleccione una descripción de repuesto válida.');return;}
      if(!destino){alert('Digite y seleccione un número de activo válido.');return;}
      const repId = item.id;
      const cant = parseInt(document.getElementById('salida-cant').value || 1);

      if (item) {
        if (item.stock < cant) {
          alert('Error: Cantidad supera el stock en bodega.');
          return;
        }
        item.stock -= cant;
        movimientos.unshift({
          id: Date.now().toString(),
          tipo: 'Salida',
          fecha: new Date().toISOString().split('T')[0],
          repuesto: item.nombre,
          repuestoId: item.id,
          cant: cant,
          equipo: `${destino.activo} - ${destino.nombre}`,
          tecnico: document.getElementById('salida-tecnico').value.trim()
        });
        saveData();
        closeModal('modal-salida');
      }
    }

    // SALIDAS DE EQUIPOS
    function checkAtrasosSalidas() {
      const now = new Date().toISOString().slice(0, 10);
      salidasEquipos.forEach(s => {
        if (s.estado !== 'Devuelto' && s.estado !== 'Cancelado') {
          if (s.fechaPrevista && s.fechaPrevista < now) s.estado = 'Atrasado';
        }
      });
    }

    function renderSalidasEquiposTable() {
      const query = '';
      const tbody = document.getElementById('table-salida-equipos');
      tbody.innerHTML = '';

      const filtered = salidasEquipos.filter(s => {
        const eq = equipos.find(e => e.id === s.equipoId);
        const eqNombre = eq ? eq.nombre : (s.equipoNombre || '');
        const text = `${s.id} ${s.activo} ${s.serie} ${eqNombre} ${s.retira} ${s.autoriza} ${s.proveedor} ${s.motivo} ${s.estado}`.toLowerCase();
        return text.includes(query);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-slate-400 text-xs">No hay registros de salidas de equipos médicos.</td></tr>`;
        return;
      }

      filtered.slice().reverse().forEach(s => {
        const eq = equipos.find(e => e.id === s.equipoId);
        const eqNombre = eq ? eq.nombre : (s.equipoNombre || 'Equipo');
        const eqActivo = eq ? eq.activo : (s.activo || 'N/A');
        const eqSerie = eq ? eq.serie : (s.serie || 'N/A');

        let badgeClass = "bg-blue-100 text-blue-800";
        if (s.estado === 'Devuelto') badgeClass = "bg-emerald-100 text-emerald-800";
        else if (s.estado === 'Atrasado') badgeClass = "bg-red-100 text-red-800 font-bold";
        else if (s.estado === 'En reparación' || s.estado === 'Pendiente de devolución') badgeClass = "bg-amber-100 text-amber-800";

        const ultComentario = (s.comentarios && s.comentarios.length > 0) ? s.comentarios[s.comentarios.length - 1].texto : "Sin comentarios";

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition text-xs">
            <td class="p-4">
              <button onclick="openHistorialSalidaModal('${s.id}')" class="font-extrabold text-blue-600 hover:underline">#SAL-${s.id}</button>
            </td>
            <td class="p-4 font-semibold text-slate-800">${eqNombre}</td>
            <td class="p-4 font-mono text-slate-600">${eqActivo}</td>
            <td class="p-4 font-mono text-slate-500">${eqSerie}</td>
            <td class="p-4 text-slate-700">${s.retira}</td>
            <td class="p-4 text-slate-600">${s.autoriza}</td>
            <td class="p-4 text-slate-700">${s.proveedor}</td>
            <td class="p-4 text-slate-500 font-mono">${s.fechaSalida ? s.fechaSalida.replace('T', ' ') : ''}</td>
            <td class="p-4 text-slate-700">${s.motivo}</td>
            <td class="p-4 font-mono ${s.estado==='Atrasado'?'text-red-600 font-bold':''}">${s.fechaPrevista || 'N/A'}</td>
            <td class="p-4"><span class="px-2.5 py-1 rounded-full text-[10px] ${badgeClass}">${s.estado}</span></td>
            <td class="p-4 text-slate-500 max-w-xs truncate">${ultComentario}</td>
            <td class="p-4 text-right space-x-1 whitespace-nowrap">
              <button onclick="openHistorialSalidaModal('${s.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><i data-lucide="file-text" class="w-4 h-4"></i></button>
              ${s.estado !== 'Devuelto' ? `<button onclick="openDevolucionModal('${s.id}')" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"><i data-lucide="circle-check-big" class="w-4 h-4"></i></button>` : ''}
              <button onclick="deleteSalidaEquipo('${s.id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
          </tr>
        `;
      });
    }

    function openHistorialSalidaModal(salidaId) {
      const s = salidasEquipos.find(x => x.id === salidaId);
      if (!s) return;
      currentExpedienteSalidaId = salidaId;
      const eq = equipos.find(e => e.id === s.equipoId);

      document.getElementById('hist-salida-title').innerText = `Expediente de Salida #SAL-${s.id}`;
      document.getElementById('hist-salida-subtitle').innerText = `Destino: ${s.proveedor}`;

      const badgeEstado = document.getElementById('hist-badge-estado');
      badgeEstado.innerText = s.estado;
      badgeEstado.className = `mt-1 font-bold text-xs px-2.5 py-1 rounded-full inline-block ${s.estado==='Devuelto'?'bg-emerald-100 text-emerald-800':s.estado==='Atrasado'?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`;

      document.getElementById('hist-fecha-salida').innerText = s.fechaSalida ? s.fechaSalida.replace('T', ' ') : '-';
      document.getElementById('hist-fecha-prevista').innerText = s.fechaPrevista || '-';
      document.getElementById('hist-fecha-devolucion').innerText = s.fechaDevolucion ? s.fechaDevolucion.replace('T', ' ') : 'Pendiente';

      document.getElementById('hist-eq-nombre').innerText = eq ? `${eq.nombre} (${eq.marca || ''})` : s.equipoNombre;
      document.getElementById('hist-eq-activo-serie').innerText = `Activo: ${eq ? eq.activo : s.activo} | S/N: ${eq ? (eq.serie||'N/A') : (s.serie||'N/A')}`;
      document.getElementById('hist-proveedor').innerText = s.proveedor;
      document.getElementById('hist-motivo').innerText = s.motivo;
      document.getElementById('hist-autoriza').innerText = s.autoriza;
      document.getElementById('hist-retira').innerText = s.retira;

      renderHistorialTimeline(s);
      document.getElementById('hist-nuevo-comentario').value = '';
      document.getElementById('modal-historial-salida').classList.remove('hidden');
      lucide.createIcons();
    }

    function renderHistorialTimeline(s) {
      const container = document.getElementById('hist-timeline-container');
      container.innerHTML = '';
      const totalNotas = s.comentarios ? s.comentarios.length : 0;
      document.getElementById('hist-comentarios-count').innerText = `${totalNotas} ${totalNotas === 1 ? 'registro' : 'registros'}`;
      if (!s.comentarios || s.comentarios.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic py-3 text-center">Sin bitácora registrada.</p>`;
        return;
      }
      s.comentarios.slice().reverse().forEach(c => {
        container.innerHTML += `
          <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
            <div class="flex justify-between text-slate-400 font-mono text-[10px] mb-1">
              <span class="font-bold text-slate-700">${c.usuario}</span>
              <span>${c.fecha}</span>
            </div>
            <p class="text-slate-700 font-medium">${c.texto}</p>
          </div>
        `;
      });
    }

    function addAvanceFromExpediente() {
      const input = document.getElementById('hist-nuevo-comentario');
      const texto = input.value.trim();
      if (!texto) return;
      const s = salidasEquipos.find(x => x.id === currentExpedienteSalidaId);
      if (s) {
        if (!s.comentarios) s.comentarios = [];
        s.comentarios.push({ fecha: new Date().toLocaleString(), usuario: "Ing. Ramírez", texto: texto });
        saveData();
        input.value = '';
        renderHistorialTimeline(s);
      }
    }

    function openSalidaEquipoModal() {
      document.getElementById('seq-search-activo').value = '';
      populateSeqEquipoOptions(equipos);
      const selectProv = document.getElementById('seq-proveedor-select');
      selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>';
      proveedores.forEach(p => selectProv.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`);

      document.getElementById('seq-id').value = "";
      document.getElementById('seq-retira').value = "";
      document.getElementById('seq-autoriza').value = "";
      document.getElementById('seq-proveedor').value = "";
      document.getElementById('seq-motivo').value = "Reparación";
      
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('seq-fecha-salida').value = now.toISOString().slice(0, 16);
      
      const prev = new Date();
      prev.setDate(prev.getDate() + 7);
      document.getElementById('seq-fecha-prevista').value = prev.toISOString().slice(0, 10);
      document.getElementById('seq-comentarios').value = "";

      document.getElementById('seq-equipo').value='';
      updateSeqEquipoPreview(null);

      document.getElementById('modal-salida-equipo').classList.remove('hidden');
      lucide.createIcons();
    }

    function populateSeqEquipoOptions(lista) {
      fillEquipoDatalist('seq-equipo-list',lista);
    }

    function filterSeqEquipoOptions(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = equipos.filter(e => `${e.activo} ${e.serie || ''} ${e.nombre}`.toLowerCase().includes(q));
      populateSeqEquipoOptions(filtered);
      const exact=findEquipoBySearch(query);document.getElementById('seq-equipo').value=exact?.id||'';updateSeqEquipoPreview(exact);
    }

    function handleSearchActivoKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        autoSelectFirstMatchedEquipo();
      }
    }

    function autoSelectFirstMatchedEquipo() {
      const query = document.getElementById('seq-search-activo').value.trim().toLowerCase();
      if (!query) {
        if (equipos.length > 0) onSeqEquipoSelected(equipos[0].id);
        return;
      }
      let match = equipos.find(e => e.activo.toLowerCase() === query || `${e.activo} ${e.nombre}`.toLowerCase().includes(query));
      if (match) {
        populateSeqEquipoOptions(equipos);
        document.getElementById('seq-equipo').value = match.id;
        onSeqEquipoSelected(match.id);
        document.getElementById('seq-search-activo').value = match.activo;
      } else {
        alert('No se encontró el equipo.');
      }
    }

    function onSeqEquipoSelected(eqId) {
      const eq = equipos.find(e => e.id === eqId);
      updateSeqEquipoPreview(eq);
    }
    function onSeqEquipoSearch(value){const eq=findEquipoBySearch(value);document.getElementById('seq-equipo').value=eq?.id||'';updateSeqEquipoPreview(eq);}

    function updateSeqEquipoPreview(eq) {
      if (eq) {
        document.getElementById('seq-prev-nombre').innerText = `${eq.nombre} — ${eq.marca || ''}`;
        document.getElementById('seq-prev-detalles').innerText = `Activo: ${eq.activo} | Sede: ${eq.ubicacion || 'General'}`;
        const estadoBadge = document.getElementById('seq-prev-estado');
        estadoBadge.innerText = eq.estado;
        estadoBadge.className = `px-2 py-0.5 rounded-full text-[10px] font-bold ${eq.estado==='Operativo'?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}`;
      } else {
        document.getElementById('seq-prev-nombre').innerText = 'Ningún equipo seleccionado';
        document.getElementById('seq-prev-detalles').innerText = 'Activo: -';
        document.getElementById('seq-prev-estado').innerText = '-';
      }
    }

    function syncSeqProveedorSelect(selectEl) {
      if (selectEl.value) document.getElementById('seq-proveedor').value = selectEl.value;
    }

    function saveSalidaEquipo(e) {
      e.preventDefault();
      const eqId = document.getElementById('seq-equipo').value;
      const eq = equipos.find(x => x.id === eqId);
      if (!eq) { alert('Digite y seleccione un número de activo válido.'); return; }

      const comTexto = document.getElementById('seq-comentarios').value;
      const comentariosArr = [];
      if (comTexto.trim() !== "") {
        comentariosArr.push({ fecha: new Date().toLocaleString(), usuario: "Ing. Ramírez", texto: comTexto.trim() });
      }

      salidasEquipos.push({
        id: Date.now().toString(),
        equipoId: eqId,
        activo: eq ? eq.activo : "",
        serie: eq ? eq.serie : "",
        equipoNombre: eq ? eq.nombre : "",
        retira: document.getElementById('seq-retira').value.trim(),
        autoriza: document.getElementById('seq-autoriza').value.trim(),
        proveedor: document.getElementById('seq-proveedor').value.trim(),
        fechaSalida: document.getElementById('seq-fecha-salida').value,
        motivo: document.getElementById('seq-motivo').value,
        fechaPrevista: document.getElementById('seq-fecha-prevista').value,
        estado: "Enviado / Fuera de la institución",
        fechaDevolucion: "",
        recibe: "",
        estadoDevolucion: "",
        comentarios: comentariosArr
      });

      saveData();
      closeModal('modal-salida-equipo');
    }

    function openDevolucionModal(salidaId) {
      const s = salidasEquipos.find(x => x.id === salidaId);
      if (!s) return;
      document.getElementById('dev-seq-id').value = salidaId;
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('dev-fecha-real').value = now.toISOString().slice(0, 16);
      document.getElementById('dev-recibe').value = "";
      document.getElementById('dev-comentarios').value = "";
      document.getElementById('modal-devolucion-equipo').classList.remove('hidden');
      lucide.createIcons();
    }

    function saveDevolucionEquipo(e) {
      e.preventDefault();
      const id = document.getElementById('dev-seq-id').value;
      const s = salidasEquipos.find(x => x.id === id);
      if (s) {
        s.fechaDevolucion = document.getElementById('dev-fecha-real').value;
        s.recibe = document.getElementById('dev-recibe').value.trim();
        s.estadoDevolucion = document.getElementById('dev-estado-equipo').value;
        s.estado = "Devuelto";

        const finalCom = document.getElementById('dev-comentarios').value.trim();
        if (!s.comentarios) s.comentarios = [];
        s.comentarios.push({ fecha: new Date().toLocaleString(), usuario: s.recibe || "Ing. Ramírez", texto: `[DEVOLUCIÓN - ${s.estadoDevolucion}] ${finalCom}` });

        const eq = equipos.find(x => x.id === s.equipoId);
        if (eq && s.estadoDevolucion) eq.estado = s.estadoDevolucion;

        saveData();
        closeModal('modal-devolucion-equipo');
      }
    }

    function deleteSalidaEquipo(id) {
      openGenericDeleteModal({
        title:'Eliminar registro de salida',
        message:'¿Está seguro que desea eliminar este registro de salida?',
        warning:'El registro de salida se eliminará permanentemente.',
        confirmText:'Eliminar registro',
        onConfirm:()=>{salidasEquipos=salidasEquipos.filter(x=>x.id!==id);saveData();}
      });
    }

