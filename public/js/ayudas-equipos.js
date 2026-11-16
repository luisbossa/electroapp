/* Módulo: ayudas equipos. Se carga en el orden indicado en index.html. */
    function toggleTipoGarantiaField() {
      const condic = document.getElementById('eq-condicGarantia')?.value || 'Ninguno';
      const wrapper = document.getElementById('wrapper-tipo-garantia');
      if (wrapper) {
        if (condic === 'Bajo Garantía') wrapper.classList.remove('hidden');
        else wrapper.classList.add('hidden');
      }
    }

    function updateAutoLinkedParts() {
      const container = document.getElementById('auto-linked-parts-container');
      const countBadge = document.getElementById('linked-parts-count-badge');
      if (!container) return;

      const nombre = (document.getElementById('eq-nombre')?.value || '').toLowerCase().trim();
      const modelo = (document.getElementById('eq-modelo')?.value || '').toLowerCase().trim();
      const marca  = (document.getElementById('eq-marca')?.value || '').toLowerCase().trim();
      const activo = (document.getElementById('eq-activo')?.value || '').toLowerCase().trim();

      const matchedParts = bodega.filter(b => {
        const comp = (b.compatibilidad || '').toLowerCase();
        if (comp.includes('universal')) return true;
        const terms = comp.split(/[,/;|\n]+/).map(t => t.trim()).filter(t => t.length > 0);
        return terms.some(t => 
          (nombre && (t.includes(nombre) || nombre.includes(t))) ||
          (modelo && (t.includes(modelo) || modelo.includes(t))) ||
          (marca && (t.includes(marca) || marca.includes(t))) ||
          (activo && t.includes(activo))
        );
      });

      if (countBadge) countBadge.innerText = `${matchedParts.length} asociados`;

      if (matchedParts.length === 0) {
        container.innerHTML = `<div class="col-span-full p-6 bg-slate-50 border border-dashed rounded-xl text-center text-xs text-slate-400">Sin repuestos compatibles vinculados en bodega.</div>`;
        return;
      }

      container.innerHTML = matchedParts.map(p => `
        <div onclick="openBodegaModal('${p.id}')" class="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs cursor-pointer hover:border-blue-400 hover:shadow-sm transition flex gap-3 items-center">
          <div data-visor="${String(p.nombre || 'Repuesto').replace(/"/g, '&quot;')}" class="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 bg-contain bg-no-repeat bg-center shrink-0 flex items-center justify-center text-slate-400" style="${p.img ? 'background-image: url('+p.img+');' : ''}">
            ${!p.img ? '<i data-lucide="package" class="w-5 h-5 text-slate-400"></i>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-800 truncate">${p.nombre}</p>
            <p class="font-mono text-slate-500 text-[11px]">P/N: ${p.parte}</p>
            <div class="flex justify-between items-center pt-1">
              <span class="font-bold text-blue-600">Stock: ${p.stock}</span>
              <span class="text-slate-400">${p.estante || 'Estante N/A'}</span>
            </div>
          </div>
        </div>
      `).join('');
      lucide.createIcons();
    }

    function initChipsSelector(existingCompatString = "") {
      currentSelectedChips = [];
      if (existingCompatString) {
        currentSelectedChips = existingCompatString.split(/[,/;|\n]+/).map(t => t.trim()).filter(t => t.length > 0);
      }
      renderChips();
      populateChipDropdown();
    }

    function populateChipDropdown(filterQuery = "") {
      const select = document.getElementById('chip-quick-select');
      if (!select) return;
      select.innerHTML = '<option value="">-- Seleccionar modelo / equipo --</option>';
      const q = (filterQuery || "").toLowerCase();
      const uniqueOptions = new Set();
      equipos.forEach(e => {
        if (e.nombre) uniqueOptions.add(e.nombre);
        if (e.modelo) uniqueOptions.add(`${e.nombre} (${e.modelo})`);
        if (e.marca && e.modelo) uniqueOptions.add(`${e.marca} ${e.modelo}`);
      });
      Array.from(uniqueOptions).sort().forEach(opt => {
        if (!q || opt.toLowerCase().includes(q)) select.innerHTML += `<option value="${opt}">${opt}</option>`;
      });
    }

    function filterChipDropdown(query) { populateChipDropdown(query); }
    function addChipItem(val) {
      if (!currentUser || currentUser.rol !== 'admin') { showReadOnlyNotice(); return; }
      const item = (val || "").trim();
      if (!item) return;
      if (!currentSelectedChips.includes(item)) {
        currentSelectedChips.push(item);
        renderChips();
      }
    }
    function removeChipItem(idx) {
      if (!currentUser || currentUser.rol !== 'admin') { showReadOnlyNotice(); return; }
      currentSelectedChips.splice(idx, 1);
      renderChips();
    }
    function renderChips() {
      const container = document.getElementById('selected-chips-container');
      if (!container) return;
      const canEdit = !!currentUser && currentUser.rol === 'admin';
      if (currentSelectedChips.length === 0) {
        container.innerHTML = `<span class="text-xs text-slate-400 italic py-1">No hay equipos vinculados.</span>`;
        return;
      }
      container.innerHTML = currentSelectedChips.map((chip, idx) => `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900">
          <span>${escapeHTML(chip)}</span>
          ${canEdit ? `<button type="button" onclick="removeChipItem(${idx})" class="text-blue-600 hover:text-red-600 font-bold" title="Eliminar modelo compatible">&times;</button>` : ''}
        </span>
      `).join('');
    }

    function calculateLifecycle() {
      const fechaVal = document.getElementById('eq-fechaIngreso')?.value;
      const loemVal = parseFloat(document.getElementById('eq-loem')?.value) || 0;
      const progressBar = document.getElementById('progressBar');
      const text = document.getElementById('lifecycleText');
      const alert = document.getElementById('lifecycleAlert');
      if (!progressBar || !text) return 0;
      if (!fechaVal || loemVal <= 0) {
        progressBar.style.width = '0%';
        text.innerText = 'Sin datos';
        if (alert) alert.classList.add('hidden');
        return 0;
      }
      const diffAnios = (new Date() - new Date(fechaVal)) / (1000 * 60 * 60 * 24 * 365.25);
      const porcentaje = Math.min(Math.round((diffAnios / loemVal) * 100), 100);
      progressBar.style.width = `${porcentaje}%`;
      text.innerText = `${porcentaje}% consumido (${diffAnios.toFixed(1)} de ${loemVal} años)`;
      if (porcentaje >= 80) {
        progressBar.classList.add('danger');
        if (alert) alert.classList.remove('hidden');
      } else {
        progressBar.classList.remove('danger');
        if (alert) alert.classList.add('hidden');
      }
      return porcentaje;
    }

    function previewFile(inputId, previewId, callback) {
      const preview = document.getElementById(previewId);
      const inputEl = document.getElementById(inputId);
      const file = inputEl?.files ? inputEl.files[0] : null;
      if (file && preview) {
        const reader = new FileReader();
        reader.onloadend = function () {
          preview.style.backgroundImage = `url(${reader.result})`;
          preview.innerText = '';
          callback(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
    // Limpia el selector de archivo y muestra la foto guardada (o el aviso de vista previa si no hay).
    function resetImagePreview(inputId, previewId, img) {
      const input = document.getElementById(inputId);
      if (input) input.value = '';
      const preview = document.getElementById(previewId);
      if (!preview) return;
      if (img) {
        preview.style.backgroundImage = 'url("' + img + '")';
        preview.innerHTML = '';
      } else {
        preview.style.backgroundImage = '';
        preview.innerHTML = '<i data-lucide="image" class="w-8 h-8 text-slate-300 mb-1"></i><span>Vista Previa</span>';
      }
    }

    function setEqImg(val) { tempEqImageData = val; }
    function setRepImg(val) { tempRepImageData = val; }

    function populateContratosSelect(selectedVal = '') {
      const select = document.getElementById('eq-numProcedimiento');
      if (!select) return;
      select.innerHTML = '<option value="">-- Sin contrato vinculado --</option>';
      procedimientos.forEach(p => {
        p.contratos.forEach(c => {
          const isSel = (c.numero === selectedVal) ? 'selected' : '';
          select.innerHTML += `<option value="${c.numero}" ${isSel}>${c.numero} - ${c.nombre || 'Contrato'} (${p.numero})</option>`;
        });
      });
    }

