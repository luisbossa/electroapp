/* Módulo: proveedores. Se carga en el orden indicado en index.html. */
    function openProvModal(id = null) {
      const proveedor = id ? proveedores.find(p => p.id === id) : null;
      document.getElementById('prov-id').value = proveedor?.id || '';
      document.getElementById('prov-nombre').value = proveedor?.nombre || '';
      document.getElementById('prov-contacto').value = proveedor?.contacto || '';
      document.getElementById('prov-tel').value = proveedor?.tel || '';
      document.getElementById('prov-email').value = proveedor?.email || '';
      document.getElementById('modal-prov-title').textContent = proveedor ? 'Editar Proveedor' : 'Nuevo Proveedor';
      document.getElementById('modal-prov').classList.remove('hidden');
    }

    function saveProveedor(e) {
      e.preventDefault();
      const id = document.getElementById('prov-id').value;
      const datosProveedor = {
        nombre: document.getElementById('prov-nombre').value.trim(),
        contacto: document.getElementById('prov-contacto').value.trim(),
        tel: document.getElementById('prov-tel').value.trim(),
        email: document.getElementById('prov-email').value.trim()
      };

      if (id) {
        const indice = proveedores.findIndex(p => p.id === id);
        if (indice !== -1) proveedores[indice] = { ...proveedores[indice], ...datosProveedor };
      } else {
        proveedores.push({ id: Date.now().toString(), ...datosProveedor });
      }
      saveData();
      closeModal('modal-prov');
    }

    function deleteProveedor(id) {
      openGenericDeleteModal({
        title:'Eliminar proveedor',
        message:'¿Está seguro que desea eliminar este proveedor del directorio?',
        warning:'El proveedor se eliminará permanentemente del directorio.',
        confirmText:'Eliminar proveedor',
        onConfirm:()=>{proveedores=proveedores.filter(p=>p.id!==id);saveData();}
      });
    }

