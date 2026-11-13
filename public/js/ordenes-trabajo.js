/* Módulo: ordenes trabajo. Se carga en el orden indicado en index.html. */
    function openOTModal(id = null) {
      document.getElementById('ot-equipo').value='';fillEquipoDatalist('ot-equipo-list');
      document.getElementById('modal-ot').classList.remove('hidden');
    }

    function saveOT(e) {
      e.preventDefault();
      const equipoObj = findEquipoBySearch(document.getElementById('ot-equipo').value);
      if(!equipoObj){alert('Digite y seleccione un número de activo válido.');return;}
      const eqId = equipoObj.id;
      
      ordenes.push({
        id: Date.now().toString(),
        numero: 'OT-' + (1000 + ordenes.length + 1),
        equipoId: eqId,
        equipoNombre: equipoObj ? `${equipoObj.activo} ${equipoObj.nombre}` : 'Equipo',
        tipo: document.getElementById('ot-tipo').value,
        tecnico: document.getElementById('ot-tecnico').value.trim(),
        falla: document.getElementById('ot-falla').value.trim(),
        estado: 'Abierta'
      });

      if (equipoObj) { equipoObj.estado = 'En Mantenimiento'; }

      saveData();
      closeModal('modal-ot');
    }

    function cerrarOT(id) {
      const ot = ordenes.find(o => o.id === id);
      if (ot) {
        ot.estado = 'Cerrada';
        const eq = equipos.find(e => e.id === ot.equipoId);
        if (eq) eq.estado = 'Operativo';
        saveData();
      }
    }

    // SALIDA DE MATERIALES
