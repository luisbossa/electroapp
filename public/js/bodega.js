/* Módulo: bodega. Se carga en el orden indicado en index.html. */
    function openBodegaModal(id = null) {
      tempRepImageData = '';
      const preview = document.getElementById('repImgPreview');
      preview.style.backgroundImage = 'none';
      preview.innerText = 'Vista Previa';
      document.getElementById('chip-search-input').value = '';
      const selectProv = document.getElementById('rep-proveedor-select');
      selectProv.innerHTML = '<option value="">-- Seleccionar Proveedor --</option>';
      proveedores.forEach(p => selectProv.innerHTML += `<option value="${p.nombre}">${p.nombre}</option>`);

      if (id) {
        const item = bodega.find(b => b.id === id);
        if (item) {
          document.getElementById('modal-bodega-title').innerText = `Ficha Técnica: P/N ${item.parte}`;
          document.getElementById('rep-id').value = item.id;
          document.getElementById('rep-parte').value = item.parte || '';
          document.getElementById('rep-nombre').value = item.nombre || '';
          document.getElementById('rep-categoria').value = item.categoria || 'Sensores y Cables';
          document.getElementById('rep-marca').value = item.marca || '';
          document.getElementById('rep-sap').value = item.sap || '';
          document.getElementById('rep-sicop').value = item.sicop || '';
          document.getElementById('rep-estante').value = item.estante || '';
          document.getElementById('rep-proveedor').value = item.proveedor || '';
          document.getElementById('rep-stock').value = item.stock;
          document.getElementById('rep-ingreso-btn').classList.remove('hidden');
          document.getElementById('rep-min').value = item.min;
          document.getElementById('rep-moneda').value = item.moneda || '$';
          document.getElementById('rep-costo-monto').value = item.costo || '';
          document.getElementById('rep-observaciones').value = item.observaciones || '';
          if (item.img) {
            preview.style.backgroundImage = `url(${item.img})`;
            preview.innerText = '';
            tempRepImageData = item.img;
          }
          initChipsSelector(item.compatibilidad || "");
        }
      } else {
        document.getElementById('modal-bodega-title').innerText = 'Registrar Repuesto en Bodega';
        document.getElementById('rep-id').value = '';
        document.getElementById('rep-parte').value = '';
        document.getElementById('rep-nombre').value = '';
        document.getElementById('rep-categoria').value = 'Sensores y Cables';
        document.getElementById('rep-marca').value = '';
        document.getElementById('rep-sap').value = '';
        document.getElementById('rep-sicop').value = '';
        document.getElementById('rep-estante').value = '';
        document.getElementById('rep-proveedor').value = '';
        document.getElementById('rep-stock').value = 0;
        document.getElementById('rep-ingreso-btn').classList.add('hidden');
        document.getElementById('rep-min').value = 2;
        document.getElementById('rep-moneda').value = '$';
        document.getElementById('rep-costo-monto').value = '';
        document.getElementById('rep-observaciones').value = '';
        initChipsSelector("");
      }
      document.getElementById('modal-bodega').classList.remove('hidden');
      lucide.createIcons();
    }

    function syncRepProveedorSelect(el) {
      if (el.value) document.getElementById('rep-proveedor').value = el.value;
    }

    function saveRepuesto(e) {
      e.preventDefault();
      const id = document.getElementById('rep-id').value;
      const nuevoRep = {
        id: id || Date.now().toString(),
        parte: document.getElementById('rep-parte').value.trim(),
        nombre: document.getElementById('rep-nombre').value.trim(),
        categoria: document.getElementById('rep-categoria').value,
        marca: document.getElementById('rep-marca').value.trim(),
        sap: document.getElementById('rep-sap').value.trim(),
        sicop: document.getElementById('rep-sicop').value.trim(),
        estante: document.getElementById('rep-estante').value.trim(),
        proveedor: document.getElementById('rep-proveedor').value.trim(),
        compatibilidad: currentSelectedChips.join(', '),
        stock: id ? Number((bodega.find(x => x.id === id) || {}).stock || 0) : 0,
        min: parseInt(document.getElementById('rep-min').value || 0),
        moneda: document.getElementById('rep-moneda').value,
        costo: document.getElementById('rep-costo-monto').value.trim(),
        observaciones: document.getElementById('rep-observaciones').value.trim(),
        img: tempRepImageData || (id ? (bodega.find(x => x.id === id)||{}).img : "")
      };
      if (id) {
        const idx = bodega.findIndex(x => x.id === id);
        if (idx !== -1) bodega[idx] = nuevoRep;
      } else {
        bodega.push(nuevoRep);
      }
      saveData();
      closeModal('modal-bodega');
    }

    function openIngresoBodegaModal(repuestoId = null) {
      const id = repuestoId || document.getElementById('rep-id')?.value;
      const item = bodega.find(b => b.id === id);
      if (!item) { alert('Primero debe guardar la ficha del repuesto.'); return; }
      document.getElementById('ingreso-repuesto-id').value = item.id;
      document.getElementById('ingreso-repuesto-nombre').textContent = `${item.nombre} · P/N ${item.parte || 'N/A'}`;
      document.getElementById('ingreso-stock-actual').textContent = `Existencia actual: ${item.stock} unidad(es)`;
      document.getElementById('ingreso-cantidad').value = '';
      document.getElementById('ingreso-fecha').value = new Date().toISOString().slice(0, 10);
      document.getElementById('ingreso-origen').value = '';
      document.getElementById('ingreso-documento').value = '';
      document.getElementById('ingreso-responsable').value = currentUser?.nombre || '';
      document.getElementById('ingreso-observaciones').value = '';
      document.getElementById('modal-ingreso-bodega').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }

    function saveIngresoBodega(e) {
      e.preventDefault();
      const item = bodega.find(b => b.id === document.getElementById('ingreso-repuesto-id').value);
      const cantidad = parseInt(document.getElementById('ingreso-cantidad').value, 10);
      const origen = document.getElementById('ingreso-origen').value.trim();
      const responsable = document.getElementById('ingreso-responsable').value.trim();
      if (!item || !Number.isInteger(cantidad) || cantidad < 1 || !origen || !responsable) {
        alert('Complete la cantidad, la procedencia y el responsable del ingreso.');
        return;
      }
      item.stock = Number(item.stock || 0) + cantidad;
      movimientos.unshift({
        id: Date.now().toString(),
        tipo: 'Ingreso',
        fecha: document.getElementById('ingreso-fecha').value,
        repuesto: item.nombre,
        repuestoId: item.id,
        cant: cantidad,
        origen,
        documento: document.getElementById('ingreso-documento').value.trim(),
        equipo: origen,
        tecnico: responsable,
        observaciones: document.getElementById('ingreso-observaciones').value.trim()
      });
      saveData();
      closeModal('modal-ingreso-bodega');
      closeModal('modal-bodega');
      showBodegaSection('consumo');
    }

    function deleteRepuesto(id) {
      openGenericDeleteModal({
        title:'Eliminar artículo de bodega',
        message:'¿Está seguro que desea eliminar este repuesto definitivamente de la bodega?',
        warning:'El artículo se eliminará permanentemente de la bodega.',
        confirmText:'Eliminar artículo',
        onConfirm:()=>{bodega=bodega.filter(b=>b.id!==id);saveData();}
      });
    }

    // ==========================================
    // MÓDULO: PROCEDIMIENTOS / CONTRATOS
    // ==========================================
