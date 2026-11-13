/* Módulo: averias. Se carga en el orden indicado en index.html. */
    function calculateDowntime(fechaInicioStr, fechaFinStr = null) {
      if (!fechaInicioStr) return "-";
      const start = new Date(fechaInicioStr);
      const end = fechaFinStr ? new Date(fechaFinStr) : new Date();
      const diffMs = Math.max(0, end - start);
      const hoursTotal = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(hoursTotal / 24);
      const hours = hoursTotal % 24;
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${mins}m`;
      return `${mins}m`;
    }

    function openAveriaModal() {
      document.getElementById('av-search-activo').value = '';
      populateAvEquipoOptions(equipos);

      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('av-fecha-hora').value = now.toISOString().slice(0, 16);

      document.getElementById('av-id').value = '';
      document.getElementById('av-reporta').value = '';
      document.getElementById('av-prioridad').value = 'Media';
      document.getElementById('av-fuera-servicio').value = 'SI';
      document.getElementById('av-descripcion').value = '';
      document.getElementById('av-primer-comentario').value = '';

      document.getElementById('av-equipo').value='';
      updateAvEquipoPreview(null);

      document.getElementById('modal-averia').classList.remove('hidden');
      lucide.createIcons();
    }

    function populateAvEquipoOptions(lista) {
      fillEquipoDatalist('av-equipo-list',lista);
    }

    function filterAvEquipoOptions(query) {
      const q = (query || '').toLowerCase().trim();
      const filtered = equipos.filter(e => {
        const text = `${e.activo} ${e.serie || ''} ${e.nombre} ${e.marca || ''} ${e.modelo || ''} ${e.ubicacion || ''}`.toLowerCase();
        return text.includes(q);
      });

      populateAvEquipoOptions(filtered);
      const exact=findEquipoBySearch(query);document.getElementById('av-equipo').value=exact?.id||'';updateAvEquipoPreview(exact);
    }

    function handleSearchActivoAvKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        autoSelectFirstMatchedAvEquipo();
      }
    }

    function autoSelectFirstMatchedAvEquipo() {
      const query = document.getElementById('av-search-activo').value.trim().toLowerCase();
      if (!query) {
        if (equipos.length > 0) onAvEquipoSelected(equipos[0].id);
        return;
      }

      let match = equipos.find(e => e.activo.toLowerCase() === query);
      if (!match) {
        match = equipos.find(e => `${e.activo} ${e.serie || ''} ${e.nombre}`.toLowerCase().includes(query));
      }

      if (match) {
        populateAvEquipoOptions(equipos);
        document.getElementById('av-equipo').value = match.id;
        onAvEquipoSelected(match.id);
        document.getElementById('av-search-activo').value = match.activo;
      } else {
        alert('No se encontró ningún equipo coincidente.');
      }
    }

    function onAvEquipoSelected(eqId) {
      const eq = equipos.find(e => e.id === eqId);
      updateAvEquipoPreview(eq);
    }
    function onAvEquipoSearch(value){const eq=findEquipoBySearch(value);document.getElementById('av-equipo').value=eq?.id||'';updateAvEquipoPreview(eq);}

    function updateAvEquipoPreview(eq) {
      if (eq) {
        document.getElementById('av-prev-nombre').innerText = `${eq.nombre} — ${eq.marca || ''} ${eq.modelo || ''}`;
        document.getElementById('av-prev-detalles').innerText = `Activo: ${eq.activo} | Serie: ${eq.serie || 'N/A'} | Ubicación: ${eq.ubicacion || 'General'} (${eq.sububicacion || 'Área General'})`;
        const estadoBadge = document.getElementById('av-prev-estado');
        estadoBadge.innerText = eq.estado;
        estadoBadge.className = `px-2 py-0.5 rounded-full text-[10px] font-bold ${
          eq.estado === 'Operativo' ? 'bg-emerald-100 text-emerald-800' :
          eq.estado === 'En Mantenimiento' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
        }`;
      } else {
        document.getElementById('av-prev-nombre').innerText = 'Ningún equipo seleccionado';
        document.getElementById('av-prev-detalles').innerText = 'Activo: - | Serie: - | Ubicación: -';
        document.getElementById('av-prev-estado').innerText = '-';
        document.getElementById('av-prev-estado').className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700';
      }
    }

    function saveAveria(e) {
      e.preventDefault();
      const eqId = document.getElementById('av-equipo').value;
      const eq = equipos.find(x => x.id === eqId);

      if (!eq) {
        alert('Selecciona un equipo médico válido.');
        return;
      }

      const fechaHora = document.getElementById('av-fecha-hora').value;
      const fueraServicio = document.getElementById('av-fuera-servicio').value;
      const reporta = document.getElementById('av-reporta').value.trim();
      const descripcion = document.getElementById('av-descripcion').value.trim();
      const primerCom = document.getElementById('av-primer-comentario').value.trim();

      const comentarios = [];
      if (primerCom) {
        comentarios.push({
          fecha: new Date().toLocaleString(),
          usuario: reporta || "Ing. Ramírez",
          texto: primerCom
        });
      }

      const nuevaAveria = {
        id: Date.now().toString(),
        numero: 'REP-' + (100 + averias.length + 1),
        equipoId: eqId,
        activo: eq ? eq.activo : '',
        serie: eq ? eq.serie : '',
        equipoNombre: eq ? eq.nombre : 'Equipo',
        ubicacion: eq ? eq.ubicacion : 'General',
        servicio: eq ? (eq.sububicacion || eq.servicio || 'Servicio General') : 'General',
        fechaHora: fechaHora,
        reporta: reporta,
        prioridad: document.getElementById('av-prioridad').value,
        fueraServicio: fueraServicio,
        descripcion: descripcion,
        estado: 'Pendiente de Atención',
        fechaResolucion: '',
        tipoAtencion: '',
        tecnicoAtendio: '',
        proveedorAtendio: '',
        repuestoUtilizado: '',
        accionesRealizadas: '',
        comentarios: comentarios
      };

      averias.unshift(nuevaAveria);

      if (fueraServicio === 'SI') {
        eq.estado = 'Fuera de Servicio';
      } else if (eq.estado === 'Operativo') {
        eq.estado = 'En Mantenimiento';
      }

      saveData();
      closeModal('modal-averia');
    }

    function openHistorialAveriaModal(id) {
      const av = averias.find(a => a.id === id);
      if (!av) return;

      currentExpedienteAveriaId = id;
      const eq = equipos.find(e => e.id === av.equipoId);

      document.getElementById('hist-av-title').innerText = `Expediente de Avería #${av.numero}`;
      document.getElementById('hist-av-subtitle').innerText = `Activo: ${eq ? eq.activo : av.activo} — ${eq ? eq.nombre : av.equipoNombre}`;

      const badgeEstado = document.getElementById('hist-av-badge-estado');
      badgeEstado.innerText = av.estado;
      if (av.estado === 'Resuelta / Reparado') {
        badgeEstado.className = "mt-1 font-bold text-xs px-2.5 py-1 rounded-full inline-block bg-emerald-100 text-emerald-800";
      } else if (av.estado === 'En Reparación') {
        badgeEstado.className = "mt-1 font-bold text-xs px-2.5 py-1 rounded-full inline-block bg-blue-100 text-blue-800";
      } else {
        badgeEstado.className = "mt-1 font-bold text-xs px-2.5 py-1 rounded-full inline-block bg-red-100 text-red-800 animate-pulse";
      }

      document.getElementById('hist-av-prioridad').innerText = av.prioridad;
      document.getElementById('hist-av-fs').innerText = av.fueraServicio === 'SI' ? 'SÍ (Inoperativo)' : 'NO';
      document.getElementById('hist-av-tiempo-indisp').innerText = (av.fueraServicio === 'SI') ? calculateDowntime(av.fechaHora, av.fechaResolucion) : 'N/A (Operativo)';

      document.getElementById('hist-av-eq-nombre').innerText = eq ? `${eq.nombre} (${eq.marca || ''} ${eq.modelo || ''})` : av.equipoNombre;
      document.getElementById('hist-av-activo-serie').innerText = `Activo: ${eq ? eq.activo : av.activo} | S/N: ${eq ? (eq.serie||'N/A') : (av.serie||'N/A')}`;
      document.getElementById('hist-av-ubicacion').innerText = `${av.ubicacion} — ${av.servicio}`;
      document.getElementById('hist-av-fecha').innerText = av.fechaHora ? av.fechaHora.replace('T', ' ') : '-';
      document.getElementById('hist-av-reporta').innerText = av.reporta;
      document.getElementById('hist-av-desc').innerText = av.descripcion;

      const resBox = document.getElementById('hist-av-resolucion-info');
      if (av.estado === 'Resuelta / Reparado') {
        resBox.innerText = `Atendido: ${av.fechaResolucion.replace('T',' ')} por ${av.tecnicoAtendio} (${av.tipoAtencion}${av.proveedorAtendio ? ' - ' + av.proveedorAtendio : ''})${av.repuestoUtilizado ? ' | Repuesto: ' + av.repuestoUtilizado : ''}`;
      } else {
        resBox.innerText = "Pendiente de resolución";
      }

      renderHistorialAveriaTimeline(av);
      document.getElementById('hist-av-nuevo-comentario').value = '';
      document.getElementById('modal-historial-averia').classList.remove('hidden');
      lucide.createIcons();
    }

    function renderHistorialAveriaTimeline(av) {
      const container = document.getElementById('hist-av-timeline-container');
      container.innerHTML = '';
      const totalNotas = av.comentarios ? av.comentarios.length : 0;
      document.getElementById('hist-av-comentarios-count').innerText = `${totalNotas} ${totalNotas === 1 ? 'nota' : 'notas'}`;

      if (!av.comentarios || av.comentarios.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic py-3 text-center">No hay avances registrados aún en la bitácora.</p>`;
        return;
      }

      av.comentarios.slice().reverse().forEach((c, idx) => {
        const isLatest = idx === 0;
        container.innerHTML += `
          <div class="flex gap-3 text-xs">
            <div class="flex flex-col items-center">
              <div class="w-2.5 h-2.5 rounded-full ${isLatest ? 'bg-red-600 ring-4 ring-red-100' : 'bg-slate-300'}"></div>
              <div class="w-0.5 h-full bg-slate-200 mt-1"></div>
            </div>
            <div class="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1 mb-2">
              <div class="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span class="font-bold text-slate-700">${c.usuario || 'Técnico'}</span>
                <span>${c.fecha}</span>
              </div>
              <p class="text-slate-700 font-medium">${c.texto}</p>
            </div>
          </div>
        `;
      });
    }

    function addAvanceFromExpedienteAveria() {
      const input = document.getElementById('hist-av-nuevo-comentario');
      const texto = input.value.trim();
      if (!texto) {
        alert('Escribe un comentario o avance técnico.');
        return;
      }
      const av = averias.find(a => a.id === currentExpedienteAveriaId);
      if (av) {
        if (!av.comentarios) av.comentarios = [];
        av.comentarios.push({
          fecha: new Date().toLocaleString(),
          usuario: "Ing. Ramírez",
          texto: texto
        });
        if (av.estado === 'Pendiente de Atención') av.estado = 'En Reparación';
        saveData();
        input.value = '';
        renderHistorialAveriaTimeline(av);
      }
    }

    function openResolverAveriaModal(id) {
      const av = averias.find(a => a.id === id);
      if (!av) return;

      document.getElementById('res-av-id').value = id;
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('res-av-fecha').value = now.toISOString().slice(0, 16);

      document.getElementById('res-av-tipo-atencion').value = 'Funcionario CCSS';
      document.getElementById('res-av-tecnico').value = 'Ing. Ramírez';
      document.getElementById('res-av-proveedor').value = '';
      document.getElementById('res-av-acciones').value = '';
      document.getElementById('res-av-uso-repuesto').checked = false;
      document.getElementById('res-av-repuesto-cant').value = '1';

      document.getElementById('res-av-repuesto-select').value='';
      fillRepuestoDatalist('res-av-repuesto-list');

      toggleProveedorResolverField();
      toggleRepuestoResolverField();

      document.getElementById('modal-resolver-averia').classList.remove('hidden');
      lucide.createIcons();
    }

    function toggleProveedorResolverField() {
      const tipo = document.getElementById('res-av-tipo-atencion').value;
      const wrap = document.getElementById('wrapper-res-proveedor');
      if (tipo === 'Proveedor Externo') wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    }

    function toggleRepuestoResolverField() {
      const checked = document.getElementById('res-av-uso-repuesto').checked;
      const wrap = document.getElementById('wrapper-res-repuesto');
      if (checked) wrap.classList.remove('hidden');
      else wrap.classList.add('hidden');
    }

    function saveResolverAveria(e) {
      e.preventDefault();
      const id = document.getElementById('res-av-id').value;
      const av = averias.find(a => a.id === id);
      if (!av) return;

      const fechaRes = document.getElementById('res-av-fecha').value;
      const tipoAtencion = document.getElementById('res-av-tipo-atencion').value;
      const tecnico = document.getElementById('res-av-tecnico').value.trim();
      const proveedor = document.getElementById('res-av-proveedor').value.trim();
      const acciones = document.getElementById('res-av-acciones').value.trim();
      const usoRepuesto = document.getElementById('res-av-uso-repuesto').checked;

      let repuestoTexto = '';

      if (usoRepuesto) {
        const repItem = findRepuestoBySearch(document.getElementById('res-av-repuesto-select').value);
        const cant = parseInt(document.getElementById('res-av-repuesto-cant').value || 1);
        if (!repItem) { alert('Digite y seleccione una descripción de repuesto válida.'); return; }
        if (repItem) {
          if (repItem.stock < cant) {
            alert('Error: La cantidad solicitada supera las existencias en bodega.');
            return;
          }
          repItem.stock -= cant;
          repuestoTexto = `${cant}x ${repItem.nombre} (P/N: ${repItem.parte})`;

          movimientos.unshift({
            id: Date.now().toString(),
            tipo: 'Salida',
            fecha: fechaRes ? fechaRes.slice(0, 10) : new Date().toISOString().split('T')[0],
            repuesto: repItem.nombre,
            repuestoId: repItem.id,
            cant: cant,
            equipo: `${av.activo} ${av.equipoNombre}`,
            tecnico: tecnico
          });
        }
      }

      av.estado = 'Resuelta / Reparado';
      av.fechaResolucion = fechaRes;
      av.tipoAtencion = tipoAtencion;
      av.tecnicoAtendio = tecnico;
      av.proveedorAtendio = (tipoAtencion === 'Proveedor Externo') ? proveedor : '';
      av.repuestoUtilizado = repuestoTexto;
      av.accionesRealizadas = acciones;

      if (!av.comentarios) av.comentarios = [];
      av.comentarios.push({
        fecha: new Date().toLocaleString(),
        usuario: tecnico,
        texto: `[AVERÍA RESUELTA] ${acciones}${repuestoTexto ? ' | Repuesto utilizado: ' + repuestoTexto : ''}`
      });

      const eq = equipos.find(x => x.id === av.equipoId);
      if (eq) {
        eq.estado = 'Operativo';
      }

      saveData();
      closeModal('modal-resolver-averia');
    }

    function renderAveriasTable() {
      const tbody = document.getElementById('table-averias');
      if (!tbody) return;
      tbody.innerHTML = '';

      const search = '';

      const filtered = averias.filter(a => {
        const text = `${a.numero} ${a.activo} ${a.serie || ''} ${a.equipoNombre} ${a.ubicacion} ${a.reporta} ${a.descripcion} ${a.prioridad} ${a.estado}`.toLowerCase();
        return text.includes(search);
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-slate-400 text-xs">No hay reportes de averías registrados.</td></tr>`;
        return;
      }

      filtered.forEach(a => {
        let badgePrioridad = 'bg-blue-100 text-blue-800';
        if (a.prioridad === 'Urgente' || a.prioridad === 'Alta') badgePrioridad = 'bg-red-100 text-red-800 font-bold';
        else if (a.prioridad === 'Media') badgePrioridad = 'bg-amber-100 text-amber-800 font-semibold';
        else badgePrioridad = 'bg-slate-100 text-slate-700';

        let badgeEstado = 'bg-amber-100 text-amber-800';
        if (a.estado === 'Resuelta / Reparado') badgeEstado = 'bg-emerald-100 text-emerald-800';
        else if (a.estado === 'En Reparación') badgeEstado = 'bg-blue-100 text-blue-800';
        else badgeEstado = 'bg-red-100 text-red-800 animate-pulse font-bold';

        const tiempoIndisp = (a.fueraServicio === 'SI') ? calculateDowntime(a.fechaHora, a.fechaResolucion) : '<span class="text-slate-400">Operativo</span>';

        const ultAvance = (a.comentarios && a.comentarios.length > 0)
          ? a.comentarios[a.comentarios.length - 1].texto
          : "Sin avances";

        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition text-xs">
            <td class="p-4">
              <button onclick="openHistorialAveriaModal('${a.id}')" class="font-extrabold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 group font-mono">
                <span>#${a.numero}</span>
                <i data-lucide="external-link" class="w-3 h-3 opacity-0 group-hover:opacity-100 transition"></i>
              </button>
            </td>
            <td class="p-4 text-slate-500 font-mono">${a.fechaHora ? a.fechaHora.replace('T', ' ') : ''}</td>
            <td class="p-4">
              <p class="font-bold text-slate-800">${a.equipoNombre}</p>
              <p class="text-[11px] text-slate-400 font-mono">Activo: ${a.activo} | S/N: ${a.serie || 'N/A'}</p>
            </td>
            <td class="p-4 text-slate-600">
              <p class="font-semibold text-slate-700">${a.ubicacion}</p>
              <p class="text-[11px] text-slate-400">${a.servicio}</p>
            </td>
            <td class="p-4 font-medium text-slate-700">${a.reporta}</td>
            <td class="p-4">
              <span class="px-2.5 py-1 rounded-full text-[10px] ${badgePrioridad}">${a.prioridad}</span>
            </td>
            <td class="p-4">
              <span class="font-semibold ${a.fueraServicio === 'SI' ? 'text-red-600 font-bold' : 'text-slate-600'}">${a.fueraServicio === 'SI' ? 'Fuera de Servicio' : 'En Servicio'}</span>
            </td>
            <td class="p-4 font-mono font-bold ${a.estado !== 'Resuelta / Reparado' && a.fueraServicio === 'SI' ? 'text-red-600' : 'text-slate-700'}">
              ${tiempoIndisp}
            </td>
            <td class="p-4">
              <span class="px-2.5 py-1 rounded-full text-[10px] ${badgeEstado}">${a.estado}</span>
            </td>
            <td class="p-4 text-slate-500 max-w-xs truncate" title="${ultAvance}">${ultAvance}</td>
            <td class="p-4 text-right space-x-1 whitespace-nowrap">
              <button onclick="openHistorialAveriaModal('${a.id}')" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver Expediente de Avería">
                <i data-lucide="file-text" class="w-4 h-4"></i>
              </button>
              ${a.estado !== 'Resuelta / Reparado' ? `
                <button onclick="openResolverAveriaModal('${a.id}')" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Resolver / Reparar Avería">
                  <i data-lucide="circle-check" class="w-4 h-4"></i>
                </button>
              ` : ''}
              <button onclick="deleteAveria('${a.id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Eliminar Reporte">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>
        `;
      });
    }

    function deleteAveria(id) {
      openGenericDeleteModal({
        title:'Eliminar reporte de avería',
        message:'¿Eliminar este reporte de avería definitivamente?',
        warning:'El reporte se eliminará permanentemente.',
        confirmText:'Eliminar reporte',
        onConfirm:()=>{averias=averias.filter(a=>a.id!==id);saveData();}
      });
    }

    // ÓRDENES DE TRABAJO
