/* Módulo: equipos. Se carga en el orden indicado en index.html. */
    function openEquipoModal(id = null) {
      document.getElementById('modal-equipo').classList.remove('hidden');
      tempEqImageData = '';
      let currentContrato = '';
      if (id) {
        const eq = equipos.find(e => e.id === id);
        if (eq) {
          document.getElementById('modal-equipo-title').innerText = `Ficha Técnica: ${eq.activo}`;
          document.getElementById('eq-id').value = eq.id;
          document.getElementById('eq-activo').value = eq.activo || '';
          document.getElementById('eq-serie').value = eq.serie || '';
          document.getElementById('eq-nombre').value = eq.nombre || '';
          document.getElementById('eq-estado').value = eq.estado || 'Operativo';
          document.getElementById('eq-clasificacion').value = eq.clasificacion || 'Clase I';
          document.getElementById('eq-marca').value = eq.marca || '';
          document.getElementById('eq-modelo').value = eq.modelo || '';
          refreshUbicacionSelect(eq.ubicacion || 'SEDE CENTRAL');
          document.getElementById('eq-sububicacion').value = eq.sububicacion || '';
          document.getElementById('eq-servicio').value = eq.servicio || 'Enfermería';
          document.getElementById('eq-sap').value = eq.sap || '';
          document.getElementById('eq-sicop').value = eq.sicop || '';
          document.getElementById('eq-fechaIngreso').value = eq.fechaIngreso || '';
          document.getElementById('eq-loem').value = eq.loem || 10;
          document.getElementById('eq-condicGarantia').value = eq.condicionGarantia || 'Ninguno';
          document.getElementById('eq-tipoGarantia').value = eq.tipoGarantia || 'Direccion Regional';
          currentContrato = eq.numProcedimiento || '';
          document.getElementById('eq-frecuenciaMaint').value = eq.frecuenciaMaint || 'Semestral';
          document.getElementById('eq-nextMaint').value = eq.nextMaint || '';
          document.getElementById('eq-observaciones').value = eq.observaciones || '';
        }
      } else {
        document.getElementById('modal-equipo-title').innerText = 'Registrar Ficha Técnica de Equipo';
        document.getElementById('eq-id').value = '';
        document.getElementById('eq-activo').value = 'EQ-2026-' + Math.floor(100 + Math.random() * 900);
        document.getElementById('eq-serie').value = '';
        document.getElementById('eq-nombre').value = '';
        document.getElementById('eq-estado').value = 'Operativo';
        document.getElementById('eq-clasificacion').value = 'Clase I';
        document.getElementById('eq-marca').value = '';
        document.getElementById('eq-modelo').value = '';
        refreshUbicacionSelect((selectedLocation !== 'TODOS') ? selectedLocation : 'SEDE CENTRAL');
        document.getElementById('eq-sububicacion').value = '';
        document.getElementById('eq-servicio').value = 'Enfermería';
        document.getElementById('eq-sap').value = '';
        document.getElementById('eq-sicop').value = '';
        document.getElementById('eq-fechaIngreso').value = '';
        document.getElementById('eq-loem').value = 10;
        document.getElementById('eq-condicGarantia').value = 'Ninguno';
        document.getElementById('eq-tipoGarantia').value = 'Direccion Regional';
        currentContrato = '';
        document.getElementById('eq-frecuenciaMaint').value = 'Semestral';
        document.getElementById('eq-nextMaint').value = '';
        document.getElementById('eq-observaciones').value = '';
      }
      populateContratosSelect(currentContrato);
      toggleTipoGarantiaField();
      updateAutoLinkedParts();
      calculateLifecycle();
      renderEquipoPreventiveHistory(id);
      lucide.createIcons();
    }

    function saveEquipo(e) {
      e.preventDefault();
      const id = document.getElementById('eq-id').value;
      const condGarantia = document.getElementById('eq-condicGarantia').value;
      const nuevo = {
        id: id || Date.now().toString(),
        activo: document.getElementById('eq-activo').value.trim(),
        serie: document.getElementById('eq-serie').value.trim(),
        nombre: document.getElementById('eq-nombre').value.trim(),
        estado: document.getElementById('eq-estado').value,
        clasificacion: document.getElementById('eq-clasificacion').value,
        marca: document.getElementById('eq-marca').value.trim(),
        modelo: document.getElementById('eq-modelo').value.trim(),
        ubicacion: document.getElementById('eq-ubicacion').value,
        sububicacion: document.getElementById('eq-sububicacion').value.trim(),
        servicio: document.getElementById('eq-servicio').value,
        sap: document.getElementById('eq-sap').value.trim(),
        sicop: document.getElementById('eq-sicop').value.trim(),
        fechaIngreso: document.getElementById('eq-fechaIngreso').value,
        loem: parseInt(document.getElementById('eq-loem').value || 10),
        condicionGarantia: condGarantia,
        tipoGarantia: (condGarantia === 'Bajo Garantía') ? document.getElementById('eq-tipoGarantia').value : '',
        numProcedimiento: document.getElementById('eq-numProcedimiento').value.trim(),
        frecuenciaMaint: document.getElementById('eq-frecuenciaMaint').value,
        nextMaint: document.getElementById('eq-nextMaint').value,
        observaciones: document.getElementById('eq-observaciones').value.trim(),
        img: tempEqImageData || (id ? (equipos.find(x => x.id === id)||{}).img : "")
      };
      if (id) {
        const idx = equipos.findIndex(x => x.id === id);
        if (idx !== -1) equipos[idx] = nuevo;
      } else {
        equipos.push(nuevo);
      }
      saveData();
      closeModal('modal-equipo');
    }
    let pendingDeleteEquipoId = null;

    function deleteEquipo(id) {
      pendingDeleteEquipoId = id;
      const modal = document.getElementById('modal-eliminar-equipo');
      if (!modal) return;
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      if (window.lucide) lucide.createIcons();
    }

    function closeDeleteEquipoModal() {
      const modal = document.getElementById('modal-eliminar-equipo');
      if (modal) modal.classList.add('hidden');
      pendingDeleteEquipoId = null;
      document.body.classList.remove('overflow-hidden');
    }

    function confirmDeleteEquipo() {
      if (!pendingDeleteEquipoId) return;
      equipos = equipos.filter(e => e.id !== pendingDeleteEquipoId);
      saveData();
      closeDeleteEquipoModal();
    }

