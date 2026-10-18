(() => {
  'use strict';

  const STORAGE_KEY = 'hc_templates';
  const SHEET_STORAGE_KEY = 'hc_accumulated_sheet';
  const REMOTE_URL_KEY = 'hc_remote_url';
  const THEME_STORAGE_KEY = 'hc_theme';
  const FIELD_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

  // Catálogo completo de plantillas clínicas (.MC, .EF, .EVO, .ORD)
  const DEFAULT_TEMPLATES = [
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

  // Estado global de la SPA
  let templates = [];
  let activeTemplate = null;
  let currentView = 'expander';
  let editingId = null;
  const valuesMap = new Map(); // Conserva valores entre plantillas si el campo se llama igual
  let currentSegments = [];
  let allPillInputs = [];
  let focusablePills = [];
  let activePillIndex = 0;
  let noteInsertionCount = 0;

  // Referencias de Tema Claro / Oscuro
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  // Referencias de Pestañas (SPA Navigation)
  const tabExpander = document.getElementById('tabExpander');
  const tabNotePad = document.getElementById('tabNotePad');
  const tabBuilder = document.getElementById('tabBuilder');
  const viewExpander = document.getElementById('viewExpander');
  const viewNotePad = document.getElementById('viewNotePad');
  const viewBuilder = document.getElementById('viewBuilder');
  const noteBadge = document.getElementById('noteBadge');

  // Referencias Vista 1: Expansor Principal
  const templateSelect = document.getElementById('templateSelect');
  const quickCommandInput = document.getElementById('quickCommandInput');
  const btnResetFields = document.getElementById('btnResetFields');
  const templateTouchBar = document.getElementById('templateTouchBar');
  const activeCmdBadge = document.getElementById('activeCmdBadge');
  const activeTemplateTitle = document.getElementById('activeTemplateTitle');
  const activeCategoryBadge = document.getElementById('activeCategoryBadge');
  const pillProgressText = document.getElementById('pillProgressText');
  const btnPrevPill = document.getElementById('btnPrevPill');
  const btnNextPill = document.getElementById('btnNextPill');
  const pillCanvas = document.getElementById('pillCanvas');
  const assembledPreviewText = document.getElementById('assembledPreviewText');
  const btnInsertToSheet = document.getElementById('btnInsertToSheet');
  const btnCopyMain = document.getElementById('btnCopyMain');
  const pillMeasureSpan = document.getElementById('pillMeasureSpan');

  // Botones flotantes (FAB Dock para iPad y Escritorio)
  const fabNewTemplate = document.getElementById('fabNewTemplate');
  const fabQuickCopy = document.getElementById('fabQuickCopy');

  // Referencias Vista 2: Hoja Clínica Acumulada
  const clinicalSheetTextarea = document.getElementById('clinicalSheetTextarea');
  const btnClearSheet = document.getElementById('btnClearSheet');
  const btnCopySheet = document.getElementById('btnCopySheet');

  // Referencias Vista 3: Constructor de Plantillas
  const btnNewTemplate = document.getElementById('btnNewTemplate');
  const builderSearch = document.getElementById('builderSearch');
  const builderTemplateList = document.getElementById('builderTemplateList');
  const builderForm = document.getElementById('builderForm');
  const builderFormTitle = document.getElementById('builderFormTitle');
  const tplCommand = document.getElementById('tplCommand');
  const tplLabel = document.getElementById('tplLabel');
  const tplCategory = document.getElementById('tplCategory');
  const tplBody = document.getElementById('tplBody');
  const customPillInput = document.getElementById('customPillInput');
  const btnAddCustomPill = document.getElementById('btnAddCustomPill');
  const quickChipContainer = document.getElementById('quickChipContainer');
  const btnDuplicateTpl = document.getElementById('btnDuplicateTpl');
  const btnDeleteTpl = document.getElementById('btnDeleteTpl');

  // Colaboración / JSON / Google Sheets
  const btnOpenSyncModal = document.getElementById('btnOpenSyncModal');
  const btnImportJson = document.getElementById('btnImportJson');
  const fileImportInput = document.getElementById('fileImportInput');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnRestoreDefaults = document.getElementById('btnRestoreDefaults');
  const remoteSyncModal = document.getElementById('remoteSyncModal');
  const btnCloseSync = document.getElementById('btnCloseSync');
  const btnCancelSyncModal = document.getElementById('btnCancelSyncModal');
  const btnExecuteSync = document.getElementById('btnExecuteSync');
  const remoteUrlInput = document.getElementById('remoteUrlInput');
  const mergeRemoteCheck = document.getElementById('mergeRemoteCheck');
  const toastHost = document.getElementById('toastHost');

  // ---------------------------------------------------------------------------
  // Modo Claro / Oscuro (Light / Dark Mode)
  // ---------------------------------------------------------------------------
  function applyTheme(theme) {
    const valid = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', valid);
    if (themeIcon) themeIcon.textContent = valid === 'dark' ? '☀️' : '🌙';
    if (themeLabel) themeLabel.textContent = valid === 'dark' ? 'Claro' : 'Oscuro';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, valid);
    } catch (_) {}
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_STORAGE_KEY);
    } catch (_) {}
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  initTheme();

  // ---------------------------------------------------------------------------
  // Persistencia Multiplataforma (localStorage + GitHub Pages templates.json)
  // ---------------------------------------------------------------------------
  const hasChromeStorage =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function normalizeTemplates(list) {
    return (list || [])
      .filter((t) => t && typeof t.command === 'string' && typeof t.body === 'string')
      .map((t, idx) => {
        let cmd = t.command.trim().toUpperCase();
        if (cmd && !cmd.startsWith('.')) cmd = '.' + cmd;
        return {
          id: t.id || `tpl-${Date.now()}-${idx}`,
          command: cmd,
          label: (t.label || cmd).trim(),
          category: (t.category || 'General').trim(),
          body: t.body,
        };
      })
      .filter((t) => t.command.length > 1);
  }

  async function loadCatalog() {
    if (hasChromeStorage) {
      const data = await chrome.storage.local.get([STORAGE_KEY, REMOTE_URL_KEY]);
      if (data[REMOTE_URL_KEY]) remoteUrlInput.value = data[REMOTE_URL_KEY];
      if (Array.isArray(data[STORAGE_KEY]) && data[STORAGE_KEY].length > 0) {
        return normalizeTemplates(data[STORAGE_KEY]);
      }
    }

    try {
      const savedUrl = localStorage.getItem(REMOTE_URL_KEY);
      if (savedUrl) remoteUrlInput.value = savedUrl;
      const savedSheet = localStorage.getItem(SHEET_STORAGE_KEY);
      if (savedSheet) clinicalSheetTextarea.value = savedSheet;

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeTemplates(parsed);
        }
      }
    } catch (_) {}

    try {
      const res = await fetch('./templates.json');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          await saveCatalog(json);
          return normalizeTemplates(json);
        }
      }
    } catch (_) {}

    await saveCatalog(DEFAULT_TEMPLATES);
    return normalizeTemplates(DEFAULT_TEMPLATES);
  }

  async function saveCatalog(list) {
    const normalized = normalizeTemplates(list);
    templates = normalized;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (_) {}
    if (hasChromeStorage) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
      } catch (_) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Navegación entre las 3 vistas de la SPA
  // ---------------------------------------------------------------------------
  function switchView(mode) {
    currentView = mode;
    const isExpander = mode === 'expander';
    const isNotePad = mode === 'notepad';
    const isBuilder = mode === 'builder';

    tabExpander.classList.toggle('active', isExpander);
    tabExpander.setAttribute('aria-selected', String(isExpander));
    viewExpander.hidden = !isExpander;

    tabNotePad.classList.toggle('active', isNotePad);
    tabNotePad.setAttribute('aria-selected', String(isNotePad));
    viewNotePad.hidden = !isNotePad;

    tabBuilder.classList.toggle('active', isBuilder);
    tabBuilder.setAttribute('aria-selected', String(isBuilder));
    viewBuilder.hidden = !isBuilder;

    if (isExpander) {
      allPillInputs.forEach(resizePill);
    } else if (isBuilder) {
      renderBuilderList();
      if (!editingId && templates.length > 0) {
        loadTemplateIntoBuilder(templates[0].id);
      }
    }
  }

  tabExpander.addEventListener('click', () => switchView('expander'));
  tabNotePad.addEventListener('click', () => switchView('notepad'));
  tabBuilder.addEventListener('click', () => switchView('builder'));

  // ---------------------------------------------------------------------------
  // Motor de Píldoras Verdes (.pill) y Navegación con Tab / Táctil
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

  function resizePill(input) {
    pillMeasureSpan.textContent = input.value || input.placeholder || ' ';
    input.style.width = Math.max(pillMeasureSpan.offsetWidth + 10, 48) + 'px';
  }

  function updateAssembledPreview() {
    if (assembledPreviewText) {
      assembledPreviewText.textContent = assembleCurrentText();
    }
  }

  function renderSelectorControls() {
    templateSelect.textContent = '';
    for (const t of templates) {
      const opt = document.createElement('option');
      opt.value = t.command;
      opt.textContent = `${t.command} · ${t.label} (${t.category || 'General'})`;
      templateSelect.appendChild(opt);
    }
    if (activeTemplate) {
      templateSelect.value = activeTemplate.command;
    }

    templateTouchBar.textContent = '';
    for (const t of templates) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isCurrent = activeTemplate && activeTemplate.command === t.command;
      btn.className = 'tpl-touch-chip' + (isCurrent ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(Boolean(isCurrent)));

      const cmdSpan = document.createElement('span');
      cmdSpan.className = 'chip-cmd';
      cmdSpan.textContent = t.command;

      const lblSpan = document.createElement('span');
      lblSpan.textContent = t.label;

      btn.appendChild(cmdSpan);
      btn.appendChild(lblSpan);

      btn.addEventListener('click', () => {
        selectActiveTemplateByCommand(t.command, true);
      });
      templateTouchBar.appendChild(btn);
    }
  }

  function selectActiveTemplateByCommand(command, shouldFocusFirst = true) {
    const cmdUpper = String(command || '').trim().toUpperCase();
    const found =
      templates.find((t) => t.command.toUpperCase() === cmdUpper) || templates[0];
    if (!found) return;
    activeTemplate = found;

    activeCmdBadge.textContent = found.command;
    activeTemplateTitle.textContent = found.label;
    activeCategoryBadge.textContent = found.category || 'General';

    renderSelectorControls();
    renderPillCanvas(shouldFocusFirst);
  }

  function updatePillProgressUI() {
    if (!focusablePills.length) {
      pillProgressText.textContent = 'Sin campos variables';
      btnPrevPill.disabled = true;
      btnNextPill.disabled = true;
      return;
    }
    btnPrevPill.disabled = false;
    btnNextPill.disabled = false;
    const bounded = Math.min(Math.max(activePillIndex, 0), focusablePills.length - 1);
    pillProgressText.textContent = `Campo ${bounded + 1} de ${focusablePills.length}`;
  }

  function renderPillCanvas(shouldFocusFirst = true) {
    if (!activeTemplate) return;
    currentSegments = parseTemplate(activeTemplate.body);
    pillCanvas.textContent = '';
    allPillInputs = [];
    focusablePills = [];
    activePillIndex = 0;

    const groups = new Map();

    for (const seg of currentSegments) {
      if (seg.type === 'text') {
        pillCanvas.appendChild(document.createTextNode(seg.value));
        continue;
      }

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'pill';
      input.placeholder = seg.name;
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.setAttribute('aria-label', seg.name);
      input.value = valuesMap.get(seg.name) || '';

      const group = groups.get(seg.name) || [];
      // Solo la primera aparición de cada variable entra en la secuencia de Tab
      const isPrimary = group.length === 0;
      input.tabIndex = isPrimary ? 0 : -1;
      group.push(input);
      groups.set(seg.name, group);

      if (isPrimary) {
        const focusIdx = focusablePills.length;
        focusablePills.push(input);
        input.addEventListener('focus', () => {
          activePillIndex = focusIdx;
          updatePillProgressUI();
        });
      } else {
        input.addEventListener('focus', () => {
          const primaryIdx = focusablePills.indexOf(group[0]);
          if (primaryIdx !== -1) activePillIndex = primaryIdx;
          updatePillProgressUI();
        });
      }

      // Sincroniza todas las píldoras con el mismo nombre y ajusta su ancho en vivo
      input.addEventListener('input', () => {
        valuesMap.set(seg.name, input.value);
        for (const other of groups.get(seg.name)) {
          if (other !== input) other.value = input.value;
          resizePill(other);
        }
        updateAssembledPreview();
      });

      pillCanvas.appendChild(input);
      allPillInputs.push(input);
    }

    focusablePills.forEach((pill, i) => {
      pill.setAttribute('enterkeyhint', i < focusablePills.length - 1 ? 'next' : 'done');
    });

    allPillInputs.forEach(resizePill);
    updatePillProgressUI();
    updateAssembledPreview();

    if (shouldFocusFirst && focusablePills.length > 0) {
      focusPillAtIndex(0);
    }
  }

  function focusPillAtIndex(idx) {
    if (!focusablePills.length) return;
    const targetIdx = (idx + focusablePills.length) % focusablePills.length;
    activePillIndex = targetIdx;
    const target = focusablePills[targetIdx];
    target.focus();
    target.select();
    updatePillProgressUI();
  }

  // Navegación impecable con la tecla Tab (ciclo cerrado entre píldoras verdes) y Enter
  pillCanvas.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (!focusablePills.length) return;
      e.preventDefault();
      const currentIdx = focusablePills.indexOf(document.activeElement);
      if (currentIdx === -1) {
        focusPillAtIndex(0);
      } else if (e.shiftKey) {
        focusPillAtIndex(currentIdx - 1);
      } else {
        focusPillAtIndex(currentIdx + 1);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
      const currentIdx = focusablePills.indexOf(document.activeElement);
      if (isTouchDevice && currentIdx !== -1 && currentIdx < focusablePills.length - 1) {
        focusPillAtIndex(currentIdx + 1);
      } else {
        copyCurrentTemplateToClipboard();
      }
    }
  });

  btnPrevPill.addEventListener('click', () => {
    focusPillAtIndex(activePillIndex - 1);
  });

  btnNextPill.addEventListener('click', () => {
    focusPillAtIndex(activePillIndex + 1);
  });

  templateSelect.addEventListener('change', () => {
    selectActiveTemplateByCommand(templateSelect.value, true);
  });

  quickCommandInput.addEventListener('input', () => {
    const val = quickCommandInput.value.trim().toUpperCase();
    if (!val) return;
    const normalized = val.startsWith('.') ? val : '.' + val;
    const exactMatch = templates.find((t) => t.command.toUpperCase() === normalized);
    if (exactMatch) {
      quickCommandInput.value = '';
      selectActiveTemplateByCommand(exactMatch.command, true);
      showToast(`⚡ Plantilla ${exactMatch.command} (${exactMatch.label}) seleccionada`);
    }
  });

  btnResetFields.addEventListener('click', () => {
    valuesMap.clear();
    renderPillCanvas(true);
    showToast('🧹 Campos limpiados');
  });

  // ---------------------------------------------------------------------------
  // Ensamblaje, Portapapeles (compatible con Safari / iPadOS) y Botones Flotantes
  // ---------------------------------------------------------------------------
  function assembleCurrentText() {
    return currentSegments
      .map((seg) => (seg.type === 'text' ? seg.value : valuesMap.get(seg.name) || ''))
      .join('');
  }

  async function writeTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (_) {}
    ta.remove();
    return ok;
  }

  async function copyCurrentTemplateToClipboard() {
    const text = assembleCurrentText();
    const ok = await writeTextToClipboard(text);
    if (ok) {
      showToast('✓ ¡Copiado al portapapeles con 1 toque!');
    } else {
      showToast('⚠️ No se pudo copiar automáticamente');
    }
  }

  btnCopyMain.addEventListener('click', copyCurrentTemplateToClipboard);

  // Botón Flotante Principal: Copiar con 1 toque (copia la plantilla activa o la hoja acumulada)
  if (fabQuickCopy) {
    fabQuickCopy.addEventListener('click', async () => {
      if (currentView === 'notepad' && clinicalSheetTextarea.value.trim()) {
        const ok = await writeTextToClipboard(clinicalSheetTextarea.value.trim());
        showToast(ok ? '✓ ¡Hoja Clínica copiada con 1 toque!' : '⚠️ No se pudo copiar');
        return;
      }
      await copyCurrentTemplateToClipboard();
    });
  }

  // Botón Flotante Secundario: Nueva Plantilla con 1 toque
  if (fabNewTemplate) {
    fabNewTemplate.addEventListener('click', () => {
      switchView('builder');
      startNewTemplateInBuilder();
    });
  }

  btnInsertToSheet.addEventListener('click', async () => {
    const text = assembleCurrentText();
    const currentSheet = clinicalSheetTextarea.value.trim();
    clinicalSheetTextarea.value = currentSheet ? `${currentSheet}\n\n${text}` : text;
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
    } catch (_) {}
    noteInsertionCount++;
    noteBadge.hidden = false;
    noteBadge.textContent = String(noteInsertionCount);
    await writeTextToClipboard(clinicalSheetTextarea.value);
    showToast('➕ Enviado a Hoja Clínica y copiado al portapapeles');
  });

  // ---------------------------------------------------------------------------
  // Vista 2: Hoja Clínica Acumulada (con expansión al escribir .MC, .EF, etc.)
  // ---------------------------------------------------------------------------
  clinicalSheetTextarea.addEventListener('input', () => {
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
    } catch (_) {}

    const pos = clinicalSheetTextarea.selectionStart;
    if (pos == null) return;
    const beforeCursor = clinicalSheetTextarea.value.slice(0, pos);
    for (const t of templates) {
      const cmd = t.command;
      const re = new RegExp(`(?:^|\\s)(${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})$`, 'i');
      const m = beforeCursor.match(re);
      if (m) {
        const start = pos - m[1].length;
        clinicalSheetTextarea.setRangeText('', start, pos, 'end');
        localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
        switchView('expander');
        selectActiveTemplateByCommand(t.command, true);
        showToast(`⚡ Rellena ${t.command} y pulsa "Enviar a Hoja Clínica"`);
        break;
      }
    }
  });

  btnCopySheet.addEventListener('click', async () => {
    const text = clinicalSheetTextarea.value.trim();
    if (!text) {
      showToast('⚠️ La hoja clínica está vacía');
      return;
    }
    const ok = await writeTextToClipboard(text);
    showToast(ok ? '✓ Historia clínica completa copiada al portapapeles' : '⚠️ Error al copiar');
  });

  btnClearSheet.addEventListener('click', () => {
    if (!clinicalSheetTextarea.value.trim()) return;
    if (!confirm('¿Vaciar el contenido de la Hoja Clínica Acumulada?')) return;
    clinicalSheetTextarea.value = '';
    noteInsertionCount = 0;
    noteBadge.hidden = true;
    try {
      localStorage.removeItem(SHEET_STORAGE_KEY);
    } catch (_) {}
    showToast('🗑️ Hoja clínica vaciada');
  });

  // ---------------------------------------------------------------------------
  // Vista 3: Constructor y Gestor Visual de Plantillas Sin Código
  // ---------------------------------------------------------------------------
  function renderBuilderList() {
    const q = (builderSearch.value || '').trim().toLowerCase();
    const filtered = templates.filter(
      (t) =>
        !q ||
        t.command.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );

    builderTemplateList.textContent = '';
    for (const t of filtered) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'builder-item' + (t.id === editingId ? ' active' : '');

      const top = document.createElement('div');
      top.className = 'builder-item-top';

      const cmd = document.createElement('span');
      cmd.className = 'builder-item-cmd';
      cmd.textContent = t.command;

      const cat = document.createElement('span');
      cat.className = 'category-pill';
      cat.textContent = t.category || 'General';

      top.appendChild(cmd);
      top.appendChild(cat);

      const title = document.createElement('div');
      title.className = 'builder-item-title';
      title.textContent = t.label;

      btn.appendChild(top);
      btn.appendChild(title);
      btn.addEventListener('click', () => loadTemplateIntoBuilder(t.id));
      builderTemplateList.appendChild(btn);
    }
  }

  function loadTemplateIntoBuilder(id) {
    const found = templates.find((t) => t.id === id);
    if (!found) return;
    editingId = found.id;
    builderFormTitle.textContent = `Editar: ${found.command} · ${found.label}`;
    tplCommand.value = found.command;
    tplLabel.value = found.label;
    tplCategory.value = found.category || 'General';
    tplBody.value = found.body;
    btnDeleteTpl.disabled = templates.length <= 1;
    btnDuplicateTpl.disabled = false;
    renderBuilderList();
  }

  function startNewTemplateInBuilder() {
    editingId = null;
    builderFormTitle.textContent = 'Nueva Plantilla Clínica';
    tplCommand.value = '.NOTA';
    tplLabel.value = 'Nueva Nota Clínica';
    tplCategory.value = 'General';
    tplBody.value =
      'NOTA CLÍNICA:\nPaciente {{Nombre}} con documento {{Documento}}.\nMotivo / Hallazgos: {{Hallazgos}}\nPlan: {{Plan}}';
    btnDeleteTpl.disabled = true;
    btnDuplicateTpl.disabled = true;
    renderBuilderList();
    tplCommand.focus();
    tplCommand.select();
  }

  btnNewTemplate.addEventListener('click', startNewTemplateInBuilder);
  builderSearch.addEventListener('input', renderBuilderList);

  function insertPlaceholderIntoBuilder(varName) {
    const clean = String(varName || '')
      .replace(/[{}]/g, '')
      .trim();
    if (!clean) return;
    const token = `{{${clean}}}`;
    const start = tplBody.selectionStart ?? tplBody.value.length;
    const end = tplBody.selectionEnd ?? tplBody.value.length;
    tplBody.focus();
    tplBody.setRangeText(token, start, end, 'end');
  }

  btnAddCustomPill.addEventListener('click', () => {
    const val = customPillInput.value.trim();
    if (!val) {
      customPillInput.focus();
      return;
    }
    insertPlaceholderIntoBuilder(val);
    customPillInput.value = '';
  });

  customPillInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      btnAddCustomPill.click();
    }
  });

  quickChipContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.pill-chip');
    if (!chip) return;
    insertPlaceholderIntoBuilder(chip.dataset.var);
  });

  builderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let cmd = tplCommand.value.trim().toUpperCase();
    if (!cmd) return;
    if (!cmd.startsWith('.')) cmd = '.' + cmd;

    const label = tplLabel.value.trim() || cmd;
    const category = tplCategory.value.trim() || 'General';
    const body = tplBody.value;

    const duplicate = templates.find(
      (t) => t.command.toUpperCase() === cmd && t.id !== editingId
    );
    if (duplicate) {
      showToast(`⚠️ El comando ${cmd} ya existe en "${duplicate.label}"`);
      tplCommand.focus();
      return;
    }

    if (editingId) {
      const idx = templates.findIndex((t) => t.id === editingId);
      if (idx !== -1) {
        templates[idx] = { ...templates[idx], command: cmd, label, category, body };
      }
    } else {
      const newId = `tpl-${Date.now()}`;
      templates.push({ id: newId, command: cmd, label, category, body });
      editingId = newId;
    }

    await saveCatalog(templates);
    selectActiveTemplateByCommand(cmd, false);
    switchView('expander');
    showToast(`💾 Plantilla ${cmd} guardada y lista para rellenar`);
  });

  btnDuplicateTpl.addEventListener('click', async () => {
    const current = templates.find((t) => t.id === editingId);
    if (!current) return;
    let copyCmd = `${current.command}2`;
    while (templates.some((t) => t.command.toUpperCase() === copyCmd)) {
      copyCmd += '2';
    }
    const newId = `tpl-${Date.now()}`;
    templates.push({
      id: newId,
      command: copyCmd,
      label: `${current.label} (Copia)`,
      category: current.category,
      body: current.body,
    });
    await saveCatalog(templates);
    loadTemplateIntoBuilder(newId);
    renderSelectorControls();
    showToast(`✓ Duplicada como ${copyCmd}`);
  });

  btnDeleteTpl.addEventListener('click', async () => {
    if (!editingId || templates.length <= 1) return;
    const current = templates.find((t) => t.id === editingId);
    if (!current) return;
    if (!confirm(`¿Eliminar la plantilla "${current.command} · ${current.label}"?`)) return;

    templates = templates.filter((t) => t.id !== editingId);
    await saveCatalog(templates);
    loadTemplateIntoBuilder(templates[0].id);
    selectActiveTemplateByCommand(templates[0].command, false);
    showToast(`🗑️ Plantilla ${current.command} eliminada`);
  });

  // ---------------------------------------------------------------------------
  // Colaboración: Exportar / Importar JSON y Sincronización con Google Sheets CSV
  // ---------------------------------------------------------------------------
  btnExportJson.addEventListener('click', () => {
    const payload = JSON.stringify(templates, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `plantillas-clinicas-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Archivo JSON descargado para compartir');
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
      const merged = mergeCatalogs(templates, imported);
      await saveCatalog(merged);
      selectActiveTemplateByCommand(templates[0].command, false);
      renderBuilderList();
      showToast(`📥 ${imported.length} plantillas importadas`);
    } catch (_) {
      showToast('⚠️ Archivo JSON inválido');
    }
  });

  btnRestoreDefaults.addEventListener('click', async () => {
    if (!confirm('¿Restaurar las plantillas base (.MC, .EF, .EVO, .ORD)?')) return;
    const merged = mergeCatalogs(templates, DEFAULT_TEMPLATES);
    await saveCatalog(merged);
    selectActiveTemplateByCommand(templates[0].command, false);
    loadTemplateIntoBuilder(templates[0].id);
    showToast('↺ Catálogo base restaurado');
  });

  btnOpenSyncModal.addEventListener('click', () => {
    remoteSyncModal.hidden = false;
    remoteUrlInput.focus();
  });

  function closeSyncDialog() {
    remoteSyncModal.hidden = true;
  }

  btnCloseSync.addEventListener('click', closeSyncDialog);
  btnCancelSyncModal.addEventListener('click', closeSyncDialog);

  btnExecuteSync.addEventListener('click', async () => {
    const url = remoteUrlInput.value.trim();
    if (!url) {
      remoteUrlInput.focus();
      return;
    }
    btnExecuteSync.disabled = true;
    btnExecuteSync.textContent = 'Sincronizando...';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      let remoteList = [];
      if (raw.trim().startsWith('[') || raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw);
        remoteList = Array.isArray(parsed) ? parsed : parsed.templates || [];
      } else {
        remoteList = parseGoogleSheetCsv(raw);
      }

      const validRemote = normalizeTemplates(remoteList);
      if (!validRemote.length) {
        throw new Error('No se hallaron plantillas válidas en la URL');
      }

      try {
        localStorage.setItem(REMOTE_URL_KEY, url);
      } catch (_) {}

      const updated = mergeRemoteCheck.checked
        ? mergeCatalogs(templates, validRemote)
        : validRemote;

      await saveCatalog(updated);
      selectActiveTemplateByCommand(templates[0].command, false);
      loadTemplateIntoBuilder(templates[0].id);
      closeSyncDialog();
      showToast(`🌐 ${validRemote.length} plantillas sincronizadas con éxito`);
    } catch (err) {
      showToast(`⚠️ No se pudo sincronizar: ${err.message}`);
    } finally {
      btnExecuteSync.disabled = false;
      btnExecuteSync.textContent = 'Sincronizar Ahora';
    }
  });

  function mergeCatalogs(existing, incoming) {
    const map = new Map();
    for (const t of existing) map.set(t.command.toUpperCase(), t);
    for (const inc of incoming) {
      const key = inc.command.toUpperCase();
      if (map.has(key)) {
        const prev = map.get(key);
        map.set(key, { ...prev, ...inc, id: prev.id });
      } else {
        map.set(key, inc);
      }
    }
    return Array.from(map.values());
  }

  function parseGoogleSheetCsv(csvText) {
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
    return rows.slice(1).map((r, idx) => ({
      id: `tpl-sheet-${idx}`,
      command: r[cmdIdx] || '',
      label: (lblIdx !== -1 ? r[lblIdx] : r[cmdIdx]) || '',
      category: (catIdx !== -1 ? r[catIdx] : 'General') || 'General',
      body: r[bodyIdx] || '',
    }));
  }

  function showToast(message) {
    const el = document.createElement('div');
    el.className = 'spa-toast';
    el.textContent = message;
    toastHost.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ---------------------------------------------------------------------------
  // Inicialización de la Web App (SPA)
  // ---------------------------------------------------------------------------
  (async function initSpa() {
    templates = await loadCatalog();
    if (templates.length > 0) {
      selectActiveTemplateByCommand(templates[0].command, true);
      loadTemplateIntoBuilder(templates[0].id);
    }
  })();
})();
