(() => {
  'use strict';

  const STORAGE_KEY = 'hc_templates';
  const REMOTE_URL_KEY = 'hc_remote_url';
  const FIELD_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

  const FALLBACK_TEMPLATES = [
    {
      id: 'tpl-mc',
      command: '.MC',
      label: 'Motivo de consulta',
      category: 'Ingreso',
      body:
        'NOTA: Se atiende paciente con medidas preventivas de bioseguridad y elementos de protección personal establecidas por protocolos de la OMS, Ministerio de Salud y Guías institucionales (Se usan todos los elementos de Protección Personal suministrados por la institución). Paciente que acude al servicio con tapabocas.\n\nIDENTIFICACIÓN: Paciente {{Name}} documento {{Age}} , ocupación: {{Access Code}} reside en el barrio {{Address City/Town/Locality}} natural de {{loca}} estado civil: {{Status}} {{Item}} hijos, convivencia: {{Patient Drug}} Correo electrónico y teléfono actualizados en la historia clínica.\n\nMOTIVO DE CONSULTA: "{{Diagnosis}}"',
    },
    {
      id: 'tpl-ef',
      command: '.EF',
      label: 'Examen físico',
      category: 'Examen',
      body:
        'EXAMEN FÍSICO:\nSignos vitales: TA {{TA}} mmHg, FC {{FC}} lpm, FR {{FR}} rpm, T° {{Temperatura}} °C, SatO2 {{SatO2}} %, Peso {{Peso}} kg, Talla {{Talla}} cm.\nAspecto general: {{Aspecto general}}\nCabeza y cuello: {{Cabeza y cuello}}\nTórax: {{Tórax}}\nCardiopulmonar: {{Cardiopulmonar}}\nAbdomen: {{Abdomen}}\nExtremidades: {{Extremidades}}\nNeurológico: {{Neurológico}}',
    },
    {
      id: 'tpl-evo',
      command: '.EVO',
      label: 'Evolución',
      category: 'Evolución',
      body:
        'EVOLUCIÓN:\nPaciente {{Nombre}} en día {{Día de estancia}} de hospitalización por {{Diagnóstico}}.\nS: {{Subjetivo}}\nO: TA {{TA}} mmHg, FC {{FC}} lpm, FR {{FR}} rpm, T° {{Temperatura}} °C, SatO2 {{SatO2}} %. {{Hallazgos al examen}}\nA: {{Análisis}}\nP: {{Plan}}',
    },
    {
      id: 'tpl-ord',
      command: '.ORD',
      label: 'Órdenes médicas',
      category: 'Órdenes',
      body:
        'ÓRDENES MÉDICAS:\nPaciente: {{Nombre}} Documento: {{Documento}}\n1. {{Medicamento}} {{Dosis}} vía {{Vía}} cada {{Frecuencia}} horas por {{Duración}} días.\n2. Paraclínicos: {{Paraclínicos}}\n3. Recomendaciones: {{Recomendaciones}}\n4. Control en {{Control}}.\n\nSe explican las indicaciones a {{Nombre}}, quien refiere entender y aceptar.',
    },
  ];

  // Estado de la aplicación
  let templates = [];
  let selectedId = null;
  let searchQuery = '';
  const previewValues = new Map();
  let previewSegments = [];
  let previewInputs = [];

  // Referencias del DOM
  const templateListEl = document.getElementById('templateList');
  const templateCountEl = document.getElementById('templateCount');
  const searchInput = document.getElementById('searchInput');
  const btnNewTemplate = document.getElementById('btnNewTemplate');
  const templateForm = document.getElementById('templateForm');
  const editorTitle = document.getElementById('editorTitle');
  const inputCommand = document.getElementById('inputCommand');
  const inputLabel = document.getElementById('inputLabel');
  const inputCategory = document.getElementById('inputCategory');
  const inputBody = document.getElementById('inputBody');
  const customFieldName = document.getElementById('customFieldName');
  const btnInsertCustomField = document.getElementById('btnInsertCustomField');
  const quickPillsBar = document.getElementById('quickPillsBar');
  const detectedVarsList = document.getElementById('detectedVarsList');
  const btnDuplicate = document.getElementById('btnDuplicate');
  const btnDelete = document.getElementById('btnDelete');

  // Referencias del Simulador
  const simCommandBadge = document.getElementById('simCommandBadge');
  const simLabelTitle = document.getElementById('simLabelTitle');
  const simulatorBody = document.getElementById('simulatorBody');
  const pillMeasure = document.getElementById('pillMeasure');
  const btnClearPreview = document.getElementById('btnClearPreview');
  const btnCopyPreview = document.getElementById('btnCopyPreview');

  // Referencias de Colaboración / Import / Export / Sync
  const btnExportJson = document.getElementById('btnExportJson');
  const btnImportJson = document.getElementById('btnImportJson');
  const fileImportInput = document.getElementById('fileImportInput');
  const btnResetDefaults = document.getElementById('btnResetDefaults');
  const btnSyncRemote = document.getElementById('btnSyncRemote');
  const syncModal = document.getElementById('syncModal');
  const btnCloseSyncModal = document.getElementById('btnCloseSyncModal');
  const btnCancelSync = document.getElementById('btnCancelSync');
  const btnConfirmSync = document.getElementById('btnConfirmSync');
  const inputRemoteUrl = document.getElementById('inputRemoteUrl');
  const checkMergeRemote = document.getElementById('checkMergeRemote');
  const toastContainer = document.getElementById('toastContainer');

  // ---------------------------------------------------------------------------
  // Capa de persistencia (compatible con chrome.storage.local y modo web localStorage)
  // ---------------------------------------------------------------------------
  const hasChromeStorage =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  async function fetchDefaultJson() {
    try {
      const url =
        typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
          ? chrome.runtime.getURL('templates.json')
          : 'templates.json';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (_) {}
    return JSON.parse(JSON.stringify(FALLBACK_TEMPLATES));
  }

  async function loadTemplates() {
    if (hasChromeStorage) {
      const data = await chrome.storage.local.get([STORAGE_KEY, REMOTE_URL_KEY]);
      if (data[REMOTE_URL_KEY]) {
        inputRemoteUrl.value = data[REMOTE_URL_KEY];
      }
      if (Array.isArray(data[STORAGE_KEY]) && data[STORAGE_KEY].length > 0) {
        return normalizeTemplates(data[STORAGE_KEY]);
      }
      const defaults = await fetchDefaultJson();
      await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
      return normalizeTemplates(defaults);
    }

    // Respaldo web (localStorage)
    const savedUrl = localStorage.getItem(REMOTE_URL_KEY);
    if (savedUrl) inputRemoteUrl.value = savedUrl;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return normalizeTemplates(parsed);
      } catch (_) {}
    }
    const defaults = await fetchDefaultJson();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return normalizeTemplates(defaults);
  }

  async function saveTemplatesToStorage(list) {
    const normalized = normalizeTemplates(list);
    templates = normalized;
    if (hasChromeStorage) {
      await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }
  }

  function normalizeTemplates(list) {
    return (list || [])
      .filter((t) => t && typeof t.command === 'string' && typeof t.body === 'string')
      .map((t, idx) => {
        let cmd = t.command.trim();
        if (cmd && !cmd.startsWith('.')) cmd = '.' + cmd;
        return {
          id: t.id || `tpl-${Date.now()}-${idx}`,
          command: cmd.toUpperCase(),
          label: (t.label || cmd).trim(),
          category: (t.category || 'General').trim(),
          body: t.body,
        };
      })
      .filter((t) => t.command.length > 1);
  }

  // ---------------------------------------------------------------------------
  // Parseo de plantillas y Píldoras Verdes
  // ---------------------------------------------------------------------------
  function parseTemplate(body) {
    const segments = [];
    let last = 0;
    const text = String(body || '');
    for (const m of text.matchAll(FIELD_RE)) {
      if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
      segments.push({ type: 'field', name: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });
    return segments;
  }

  function extractVariableStats(body) {
    const counts = new Map();
    for (const m of String(body || '').matchAll(FIELD_RE)) {
      const name = m[1];
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return counts;
  }

  function resizePill(input) {
    pillMeasure.textContent = input.value || input.placeholder || ' ';
    input.style.width = pillMeasure.offsetWidth + 4 + 'px';
  }

  function renderDetectedVariables(body) {
    const counts = extractVariableStats(body);
    detectedVarsList.textContent = '';
    if (counts.size === 0) {
      const empty = document.createElement('span');
      empty.className = 'help-text';
      empty.textContent = 'Sin campos variables aún. Usa los botones verdes para insertar {{Campos}}.';
      detectedVarsList.appendChild(empty);
      return;
    }
    let orderIdx = 1;
    for (const [name, count] of counts.entries()) {
      const badge = document.createElement('span');
      badge.className = 'var-badge';
      badge.textContent = `${orderIdx++}. ${name}`;
      if (count > 1) {
        const rep = document.createElement('small');
        rep.textContent = `(×${count} auto-sincronizado)`;
        badge.appendChild(rep);
      }
      detectedVarsList.appendChild(badge);
    }
  }

  function renderLiveSimulator() {
    const cmd = (inputCommand.value || '.CMD').trim().toUpperCase();
    const lbl = (inputLabel.value || 'Sin título').trim();
    const bodyText = inputBody.value || '';

    simCommandBadge.textContent = cmd.startsWith('.') ? cmd : `.${cmd}`;
    simLabelTitle.textContent = lbl;

    previewSegments = parseTemplate(bodyText);
    simulatorBody.textContent = '';
    previewInputs = [];
    const groups = new Map();

    for (const seg of previewSegments) {
      if (seg.type === 'text') {
        simulatorBody.appendChild(document.createTextNode(seg.value));
        continue;
      }
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'pill';
      input.placeholder = seg.name;
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.value = previewValues.get(seg.name) || '';

      const group = groups.get(seg.name) || [];
      // Solo la primera aparición de cada variable entra en el orden de Tab.
      input.tabIndex = group.length ? -1 : 0;
      group.push(input);
      groups.set(seg.name, group);

      input.addEventListener('input', () => {
        previewValues.set(seg.name, input.value);
        for (const other of groups.get(seg.name)) {
          if (other !== input) other.value = input.value;
          resizePill(other);
        }
      });

      simulatorBody.appendChild(input);
      previewInputs.push(input);
    }

    previewInputs.forEach(resizePill);
    renderDetectedVariables(bodyText);
  }

  // Navegación cíclica con Tab dentro del simulador de píldoras verdes
  simulatorBody.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = previewInputs.filter((i) => i.tabIndex === 0);
    if (!focusable.length) return;
    const idx = focusable.indexOf(document.activeElement);
    if (idx === -1) return;
    if (!e.shiftKey && idx === focusable.length - 1) {
      e.preventDefault();
      focusable[0].focus();
    } else if (e.shiftKey && idx === 0) {
      e.preventDefault();
      focusable[focusable.length - 1].focus();
    }
  });

  // ---------------------------------------------------------------------------
  // Renderizado de la lista lateral y selección
  // ---------------------------------------------------------------------------
  function renderSidebar() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = templates.filter(
      (t) =>
        !q ||
        t.command.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );

    templateListEl.textContent = '';
    for (const t of filtered) {
      const varCount = extractVariableStats(t.body).size;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'template-item' + (t.id === selectedId ? ' active' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', t.id === selectedId ? 'true' : 'false');

      const top = document.createElement('div');
      top.className = 'template-item-top';

      const badge = document.createElement('span');
      badge.className = 'cmd-badge';
      badge.textContent = t.command;

      const cat = document.createElement('span');
      cat.className = 'cat-tag';
      cat.textContent = t.category || 'General';

      top.appendChild(badge);
      top.appendChild(cat);

      const label = document.createElement('div');
      label.className = 'template-item-label';
      label.textContent = t.label;

      const meta = document.createElement('div');
      meta.className = 'template-item-meta';
      meta.textContent = `${varCount} ${varCount === 1 ? 'píldora interactiva' : 'píldoras interactivas'}`;

      item.appendChild(top);
      item.appendChild(label);
      item.appendChild(meta);

      item.addEventListener('click', () => selectTemplate(t.id));
      templateListEl.appendChild(item);
    }

    templateCountEl.textContent = `${templates.length} ${
      templates.length === 1 ? 'plantilla activa' : 'plantillas activas'
    }`;
  }

  function selectTemplate(id) {
    const found = templates.find((t) => t.id === id);
    if (!found) return;
    selectedId = found.id;
    editorTitle.textContent = `Editando: ${found.command} · ${found.label}`;
    inputCommand.value = found.command;
    inputLabel.value = found.label;
    inputCategory.value = found.category || 'General';
    inputBody.value = found.body;
    btnDelete.disabled = templates.length <= 1;
    btnDuplicate.disabled = false;
    renderSidebar();
    renderLiveSimulator();
  }

  function startNewTemplate() {
    selectedId = null;
    editorTitle.textContent = 'Nueva plantilla clínica';
    inputCommand.value = '.NUEVA';
    inputLabel.value = 'Nuevo formato clínico';
    inputCategory.value = 'General';
    inputBody.value =
      'FORMATO CLÍNICO:\nPaciente {{Nombre}} con documento {{Documento}}.\nMotivo / Hallazgos: {{Hallazgos}}\nConducta: {{Plan}}';
    btnDelete.disabled = true;
    btnDuplicate.disabled = true;
    renderSidebar();
    renderLiveSimulator();
    inputCommand.focus();
    inputCommand.select();
  }

  // ---------------------------------------------------------------------------
  // Inserción de Placeholders {{Campo}} en la posición del cursor
  // ---------------------------------------------------------------------------
  function insertPlaceholderAtCursor(fieldName) {
    const clean = String(fieldName || '')
      .replace(/[{}]/g, '')
      .trim();
    if (!clean) return;
    const token = `{{${clean}}}`;
    const start = inputBody.selectionStart ?? inputBody.value.length;
    const end = inputBody.selectionEnd ?? inputBody.value.length;

    inputBody.focus();
    inputBody.setRangeText(token, start, end, 'end');
    renderLiveSimulator();
  }

  btnInsertCustomField.addEventListener('click', () => {
    const name = customFieldName.value.trim();
    if (!name) {
      customFieldName.focus();
      return;
    }
    insertPlaceholderAtCursor(name);
    customFieldName.value = '';
  });

  customFieldName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnInsertCustomField.click();
    }
  });

  quickPillsBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    insertPlaceholderAtCursor(chip.dataset.field);
  });

  // Eventos de edición en vivo
  inputCommand.addEventListener('input', renderLiveSimulator);
  inputLabel.addEventListener('input', renderLiveSimulator);
  inputBody.addEventListener('input', renderLiveSimulator);
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderSidebar();
  });

  // ---------------------------------------------------------------------------
  // Guardar, Duplicar y Eliminar
  // ---------------------------------------------------------------------------
  templateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let cmd = inputCommand.value.trim().toUpperCase();
    if (!cmd) return;
    if (!cmd.startsWith('.')) cmd = '.' + cmd;

    const label = inputLabel.value.trim() || cmd;
    const category = inputCategory.value.trim() || 'General';
    const body = inputBody.value;

    // Verificar si otro formato ya usa el mismo comando
    const conflict = templates.find(
      (t) => t.command.toUpperCase() === cmd && t.id !== selectedId
    );
    if (conflict) {
      showToast(`⚠️ El comando ${cmd} ya está en uso por "${conflict.label}".`);
      inputCommand.focus();
      return;
    }

    if (selectedId) {
      const idx = templates.findIndex((t) => t.id === selectedId);
      if (idx !== -1) {
        templates[idx] = { ...templates[idx], command: cmd, label, category, body };
      }
    } else {
      const newId = `tpl-${Date.now()}`;
      templates.push({ id: newId, command: cmd, label, category, body });
      selectedId = newId;
    }

    await saveTemplatesToStorage(templates);
    selectTemplate(selectedId);
    showToast(`✓ Plantilla ${cmd} guardada y activa en todas las pestañas`);
  });

  btnNewTemplate.addEventListener('click', startNewTemplate);

  btnDuplicate.addEventListener('click', async () => {
    const current = templates.find((t) => t.id === selectedId);
    if (!current) return;
    const newId = `tpl-${Date.now()}`;
    let copyCmd = `${current.command}2`;
    while (templates.some((t) => t.command.toUpperCase() === copyCmd)) {
      copyCmd += '2';
    }
    const copy = {
      id: newId,
      command: copyCmd,
      label: `${current.label} (Copia)`,
      category: current.category,
      body: current.body,
    };
    templates.push(copy);
    await saveTemplatesToStorage(templates);
    selectTemplate(newId);
    showToast(`✓ Plantilla duplicada como ${copyCmd}`);
  });

  btnDelete.addEventListener('click', async () => {
    if (!selectedId || templates.length <= 1) return;
    const current = templates.find((t) => t.id === selectedId);
    if (!current) return;
    if (!confirm(`¿Eliminar la plantilla "${current.command} · ${current.label}"?`)) return;

    templates = templates.filter((t) => t.id !== selectedId);
    await saveTemplatesToStorage(templates);
    selectTemplate(templates[0].id);
    showToast(`🗑️ Plantilla ${current.command} eliminada`);
  });

  // ---------------------------------------------------------------------------
  // Simulador: Limpiar y Copiar texto ensamblado
  // ---------------------------------------------------------------------------
  btnClearPreview.addEventListener('click', () => {
    previewValues.clear();
    renderLiveSimulator();
    const first = previewInputs.find((i) => i.tabIndex === 0);
    if (first) first.focus();
  });

  btnCopyPreview.addEventListener('click', async () => {
    const assembled = previewSegments
      .map((seg) => (seg.type === 'text' ? seg.value : previewValues.get(seg.name) || ''))
      .join('');
    try {
      await navigator.clipboard.writeText(assembled);
      showToast('✓ Texto ensamblado copiado al portapapeles');
    } catch (_) {
      showToast('No se pudo copiar al portapapeles');
    }
  });

  // ---------------------------------------------------------------------------
  // Colaboración: Exportar / Importar JSON y Sincronización Remota (JSON / Google Sheets CSV)
  // ---------------------------------------------------------------------------
  btnExportJson.addEventListener('click', () => {
    const payload = JSON.stringify(templates, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `plantillas-historia-clinica-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Archivo JSON exportado para compartir');
  });

  btnImportJson.addEventListener('click', () => {
    fileImportInput.value = '';
    fileImportInput.click();
  });

  fileImportInput.addEventListener('change', async () => {
    const file = fileImportInput.files && fileImportInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = normalizeTemplates(JSON.parse(text));
      if (!imported.length) {
        showToast('⚠️ El archivo no contiene plantillas válidas');
        return;
      }
      const merged = mergeTemplateLists(templates, imported, true);
      await saveTemplatesToStorage(merged);
      selectTemplate(templates[0].id);
      showToast(`📥 ${imported.length} plantillas importadas exitosamente`);
    } catch (err) {
      showToast('⚠️ Error al leer el archivo JSON');
    }
  });

  btnResetDefaults.addEventListener('click', async () => {
    if (!confirm('¿Restaurar el catálogo base (.MC, .EF, .EVO, .ORD)? Se conservarán las plantillas personalizadas que tengan otros comandos.')) {
      return;
    }
    const defaults = await fetchDefaultJson();
    const merged = mergeTemplateLists(templates, defaults, true);
    await saveTemplatesToStorage(merged);
    selectTemplate(templates[0].id);
    showToast('↺ Plantillas base restauradas');
  });

  // Modal de sincronización remota (JSON o Google Sheet CSV)
  btnSyncRemote.addEventListener('click', () => {
    syncModal.hidden = false;
    inputRemoteUrl.focus();
  });

  function closeSyncModal() {
    syncModal.hidden = true;
  }

  btnCloseSyncModal.addEventListener('click', closeSyncModal);
  btnCancelSync.addEventListener('click', closeSyncModal);

  btnConfirmSync.addEventListener('click', async () => {
    const url = inputRemoteUrl.value.trim();
    if (!url) {
      inputRemoteUrl.focus();
      return;
    }
    btnConfirmSync.disabled = true;
    btnConfirmSync.textContent = 'Sincronizando...';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rawText = await res.text();
      let remoteTemplates = [];

      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawText);
        remoteTemplates = Array.isArray(parsed) ? parsed : parsed.templates || [];
      } else {
        remoteTemplates = parseCsvTemplates(rawText);
      }

      const normalizedRemote = normalizeTemplates(remoteTemplates);
      if (!normalizedRemote.length) {
        throw new Error('No se encontraron plantillas válidas en la URL');
      }

      if (hasChromeStorage) {
        await chrome.storage.local.set({ [REMOTE_URL_KEY]: url });
      } else {
        localStorage.setItem(REMOTE_URL_KEY, url);
      }

      const finalTemplates = checkMergeRemote.checked
        ? mergeTemplateLists(templates, normalizedRemote, true)
        : normalizedRemote;

      await saveTemplatesToStorage(finalTemplates);
      selectTemplate(templates[0].id);
      closeSyncModal();
      showToast(`🌐 Sincronizadas ${normalizedRemote.length} plantillas del equipo`);
    } catch (err) {
      showToast(`⚠️ Error al sincronizar: ${err.message}`);
    } finally {
      btnConfirmSync.disabled = false;
      btnConfirmSync.textContent = 'Sincronizar ahora';
    }
  });

  function mergeTemplateLists(currentList, incomingList, preferIncoming = true) {
    const map = new Map();
    for (const t of currentList) {
      map.set(t.command.toUpperCase(), t);
    }
    for (const inc of incomingList) {
      const key = inc.command.toUpperCase();
      if (map.has(key) && preferIncoming) {
        const existing = map.get(key);
        map.set(key, { ...existing, ...inc, id: existing.id });
      } else if (!map.has(key)) {
        map.set(key, inc);
      }
    }
    return Array.from(map.values());
  }

  // Parser RFC-4180 para Google Sheets publicadas como CSV (soporta saltos de línea dentro de celdas)
  function parseCsvTemplates(csvText) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const ch = csvText[i];
      const next = csvText[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(cell);
          cell = '';
        } else if (ch === '\r' && next === '\n') {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = '';
          i++;
        } else if (ch === '\n') {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = '';
        } else {
          cell += ch;
        }
      }
    }
    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    if (rows.length < 2) return [];
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const cmdIdx = headers.findIndex((h) => h === 'command' || h === 'comando');
    const lblIdx = headers.findIndex((h) => h === 'label' || h === 'nombre' || h === 'titulo');
    const catIdx = headers.findIndex((h) => h === 'category' || h === 'categoria' || h === 'servicio');
    const bodyIdx = headers.findIndex((h) => h === 'body' || h === 'plantilla' || h === 'contenido');

    if (cmdIdx === -1 || bodyIdx === -1) return [];

    return rows.slice(1).map((r, i) => ({
      id: `tpl-csv-${i}`,
      command: r[cmdIdx] || '',
      label: (lblIdx !== -1 ? r[lblIdx] : r[cmdIdx]) || '',
      category: (catIdx !== -1 ? r[catIdx] : 'General') || 'General',
      body: r[bodyIdx] || '',
    }));
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // ---------------------------------------------------------------------------
  // Arranque inicial
  // ---------------------------------------------------------------------------
  (async function init() {
    templates = await loadTemplates();
    if (templates.length > 0) {
      selectTemplate(templates[0].id);
    } else {
      startNewTemplate();
    }
  })();
})();
