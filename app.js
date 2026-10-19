(() => {
  'use strict';

  const STORAGE_KEY = 'hc_templates';
  const CATALOG_VERSION_KEY = 'hc_catalog_version';
  const CURRENT_CATALOG_VERSION = '2.2.0';
  const SHEET_STORAGE_KEY = 'hc_accumulated_sheet';
  const REMOTE_URL_KEY = 'hc_remote_url';
  const THEME_STORAGE_KEY = 'hc_theme';
  const COPY_FORMAT_KEY = 'hc_copy_format';

  // Catálogo completo con Formato Rico y la nueva Plantilla Pediátrica Estándar (.PED / .PEDIATRIA)
  const DEFAULT_TEMPLATES = [
    {
      id: 'tpl-ped',
      command: '.PED',
      aliases: ['.PEDIATRIA'],
      label: 'Historia clínica pediátrica',
      category: 'Pediatría',
      body:
        '#### Identificación:\n' +
        '**Nombre:** {{Nombre}}\n' +
        '**Edad:** {{Edad}}\n' +
        '**Fecha de nacimiento:** {{Fecha de nacimiento}}\n' +
        '**Natural de:** {{Natural de}}\n' +
        '**Residencia:** {{Residencia}}\n' +
        '**Ocupación:** {{Ocupacion}}\n' +
        '**Acompañante:** {{Acompanante}}\n\n' +
        '#### Motivo de consulta:\n' +
        '"{{Motivo de consulta}}"\n\n' +
        '#### Enfermedad actual:\n' +
        '{{Enfermedad actual}}\n\n' +
        '#### Antecedentes\n' +
        '**Prenatales:**\n' +
        '- {{Prenatales}}\n\n' +
        '**Perinatales:**\n' +
        '- {{Perinatales}}\n\n' +
        '**Patológicos:** {{Patologicos}}\n' +
        '**Farmacológicos:** {{Farmacologicos}}\n' +
        '**Alérgicos:** {{Alergicos}}\n' +
        '**Inmunizaciones:** {{Inmunizaciones}}\n' +
        '**Familiares:** {{Familiares}}\n' +
        '**Hospitalizaciones:** {{Hospitalizaciones}}\n' +
        '**Quirúrgicos:** {{Quirurgicos}}\n' +
        '**Infecciones:** {{Infecciones}}\n' +
        '**Traumáticos:** {{Traumaticos}}\n' +
        '**Neurodesarrollo:** {{Neurodesarrollo}}\n' +
        '**Alimentarios:** {{Alimentarios}}\n\n' +
        '#### Revisión por sistemas\n' +
        '**Síntomas generales:** {{Sintomas generales}}\n' +
        '**Cabeza y cuello:** {{Cabeza y cuello}}\n' +
        '**Cardiopulmonar:** {{Cardiopulmonar}}\n' +
        '**Gastrointestinales:** {{Gastrointestinales}}\n' +
        '**Genitourinario:** {{Genitourinario}}\n' +
        '**Piel y anexos:** {{Piel y anexos}}\n' +
        '**Neurológico:** {{Neurologico}}\n\n' +
        '#### Examen físico\n' +
        '**Triángulo de evaluación pediátrica**\n' +
        '- **Apariencia:** {{Apariencia}}\n' +
        '- **Trabajo respiratorio:** {{Trabajo respiratorio}}\n' +
        '- **Circulación cutánea:** {{Circulacion cutanea}}\n\n' +
        '**Signos vitales y antropometría:**\n' +
        '- **Temperatura:** {{Temperatura}} °C\n' +
        '- **Frecuencia cardiaca:** {{Frecuencia cardiaca}} lpm\n' +
        '- **Frecuencia respiratoria:** {{Frecuencia respiratoria}} rpm\n' +
        '- **Saturación:** {{Saturacion}} %\n' +
        '- **Presión arterial:** {{Presion arterial}} mmHg\n' +
        '- **Perímetro cefálico:** {{Perimetro cefalico}} cm\n' +
        '- **Peso:** {{Peso}} kg\n' +
        '- **Talla:** {{Talla}} cm\n' +
        '- **Antropometría (Talla/Edad, Peso/Edad, Peso/Talla):** {{Antropometria}}\n\n' +
        '**Examen físico general y segmentario:**\n' +
        '{{Examen fisico general}}\n\n' +
        '#### Análisis y plan\n' +
        '{{Analisis y plan}}',
    },
    {
      id: 'tpl-mc',
      command: '.MC',
      label: 'Motivo de consulta',
      category: 'Ingreso',
      body:
        '#### Nota de bioseguridad\n' +
        'Se atiende paciente con medidas preventivas de bioseguridad y elementos de protección personal establecidas por protocolos de la OMS, Ministerio de Salud y Guías institucionales (Se usan todos los elementos de Protección Personal suministrados por la institución). Paciente que acude al servicio con tapabocas.\n\n' +
        '#### Identificación:\n' +
        'Paciente {{Name}} documento {{Age}}, **ocupación:** {{Access Code}}, reside en el barrio {{Address City/Town/Locality}}, natural de {{loca}}, **estado civil:** {{Status}}, {{Item}} hijos, **convivencia:** {{Patient Drug}}. Correo electrónico y teléfono actualizados en la historia clínica.\n\n' +
        '#### Motivo de consulta:\n' +
        '"{{Diagnosis}}"',
    },
    {
      id: 'tpl-ef',
      command: '.EF',
      label: 'Examen físico',
      category: 'Examen',
      body:
        '#### Examen físico\n' +
        '**Signos vitales:** TA {{TA}} mmHg, FC {{FC}} lpm, FR {{FR}} rpm, T° {{Temperatura}} °C, SatO2 {{SatO2}} %, Peso {{Peso}} kg, Talla {{Talla}} cm.\n' +
        '**Aspecto general:** {{Aspecto general}}\n' +
        '**Cabeza y cuello:** {{Cabeza y cuello}}\n' +
        '**Tórax:** {{Tórax}}\n' +
        '**Cardiopulmonar:** {{Cardiopulmonar}}\n' +
        '**Abdomen:** {{Abdomen}}\n' +
        '**Extremidades:** {{Extremidades}}\n' +
        '**Neurológico:** {{Neurológico}}',
    },
    {
      id: 'tpl-evo',
      command: '.EVO',
      label: 'Evolución SOAP',
      category: 'Evolución',
      body:
        '#### Evolución médica\n' +
        'Paciente {{Nombre}} en día {{Día de estancia}} de hospitalización por {{Diagnóstico}}.\n' +
        '**S (Subjetivo):** {{Subjetivo}}\n' +
        '**O (Objetivo):** TA {{TA}} mmHg, FC {{FC}} lpm, FR {{FR}} rpm, T° {{Temperatura}} °C, SatO2 {{SatO2}} %. {{Hallazgos al examen}}\n' +
        '**A (Análisis):** {{Análisis}}\n' +
        '**P (Plan):** {{Plan}}',
    },
    {
      id: 'tpl-ord',
      command: '.ORD',
      label: 'Órdenes médicas',
      category: 'Órdenes',
      body:
        '#### Órdenes médicas\n' +
        '**Paciente:** {{Nombre}} · **Documento:** {{Documento}}\n' +
        '1. **Medicamento:** {{Medicamento}} {{Dosis}} vía {{Vía}} cada {{Frecuencia}} horas por {{Duración}} días.\n' +
        '2. **Paraclínicos:** {{Paraclínicos}}\n' +
        '3. **Recomendaciones:** {{Recomendaciones}}\n' +
        '4. **Control en:** {{Control}}.\n\n' +
        'Se explican las indicaciones a {{Nombre}}, quien refiere entender y aceptar.',
    },
  ];

  // Estado global de la SPA
  let templates = [];
  let activeTemplate = null;
  let editingId = null;
  const valuesMap = new Map();
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
  const assembledPreviewRich = document.getElementById('assembledPreviewRich');
  const copyFormatSelect = document.getElementById('copyFormatSelect');
  const btnInsertToSheet = document.getElementById('btnInsertToSheet');
  const btnCopyMain = document.getElementById('btnCopyMain');
  const pillMeasureSpan = document.getElementById('pillMeasureSpan');

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
  const btnFmtHeading = document.getElementById('btnFmtHeading');
  const btnFmtBold = document.getElementById('btnFmtBold');
  const btnFmtBullet = document.getElementById('btnFmtBullet');
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
      const savedCopyFmt = localStorage.getItem(COPY_FORMAT_KEY);
      if (savedCopyFmt && copyFormatSelect) copyFormatSelect.value = savedCopyFmt;
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

  if (copyFormatSelect) {
    copyFormatSelect.addEventListener('change', () => {
      try {
        localStorage.setItem(COPY_FORMAT_KEY, copyFormatSelect.value);
      } catch (_) {}
      updateAssembledPreview();
    });
  }

  initTheme();

  // ---------------------------------------------------------------------------
  // Persistencia y Actualización Automática de Catálogo (para incluir .PED)
  // ---------------------------------------------------------------------------
  const hasChromeStorage =
    typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function normalizeTemplates(list) {
    return (list || [])
      .filter((t) => t && typeof t.command === 'string' && typeof t.body === 'string')
      .map((t, idx) => {
        let cmd = t.command.trim().toUpperCase();
        if (cmd && !cmd.startsWith('.')) cmd = '.' + cmd;
        const aliases = Array.isArray(t.aliases)
          ? t.aliases.map((a) => String(a).trim().toUpperCase())
          : cmd === '.PED'
          ? ['.PEDIATRIA']
          : [];
        return {
          id: t.id || `tpl-${Date.now()}-${idx}`,
          command: cmd,
          aliases,
          label: (t.label || cmd).trim(),
          category: (t.category || 'General').trim(),
          body: t.body,
        };
      })
      .filter((t) => t.command.length > 1);
  }

  async function loadCatalog() {
    let storedList = null;
    let storedVersion = null;

    try {
      storedVersion = localStorage.getItem(CATALOG_VERSION_KEY);
      const savedUrl = localStorage.getItem(REMOTE_URL_KEY);
      if (savedUrl) remoteUrlInput.value = savedUrl;
      const savedSheet = localStorage.getItem(SHEET_STORAGE_KEY);
      if (savedSheet) clinicalSheetTextarea.value = savedSheet;

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          storedList = normalizeTemplates(parsed);
        }
      }
    } catch (_) {}

    if (!storedList && hasChromeStorage) {
      const data = await chrome.storage.local.get([STORAGE_KEY, REMOTE_URL_KEY]);
      if (data[REMOTE_URL_KEY]) remoteUrlInput.value = data[REMOTE_URL_KEY];
      if (Array.isArray(data[STORAGE_KEY]) && data[STORAGE_KEY].length > 0) {
        storedList = normalizeTemplates(data[STORAGE_KEY]);
      }
    }

    // Si el catálogo guardado es de una versión anterior o no tiene .PED, fusionar con DEFAULT_TEMPLATES actualizados
    if (storedList && storedVersion === CURRENT_CATALOG_VERSION) {
      return storedList;
    }

    let baseDefaults = DEFAULT_TEMPLATES;
    try {
      const res = await fetch('./templates.json', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) baseDefaults = json;
      }
    } catch (_) {}

    const finalCatalog = storedList
      ? mergeCatalogs(baseDefaults, storedList, true)
      : normalizeTemplates(baseDefaults);

    await saveCatalog(finalCatalog);
    try {
      localStorage.setItem(CATALOG_VERSION_KEY, CURRENT_CATALOG_VERSION);
    } catch (_) {}
    return finalCatalog;
  }

  async function saveCatalog(list) {
    const normalized = normalizeTemplates(list);
    templates = normalized;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(CATALOG_VERSION_KEY, CURRENT_CATALOG_VERSION);
    } catch (_) {}
    if (hasChromeStorage) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
      } catch (_) {}
    }
  }

  // Fusiona conservando las plantillas personalizadas del usuario y asegurando las nuevas (.PED)
  function mergeCatalogs(defaultsOrExisting, incoming, preferDefaultsForBuiltin = false) {
    const map = new Map();
    for (const t of normalizeTemplates(defaultsOrExisting)) {
      map.set(t.command.toUpperCase(), t);
    }
    for (const inc of normalizeTemplates(incoming)) {
      const key = inc.command.toUpperCase();
      if (map.has(key)) {
        if (!preferDefaultsForBuiltin) {
          const prev = map.get(key);
          map.set(key, { ...prev, ...inc, id: prev.id });
        }
      } else {
        map.set(key, inc);
      }
    }
    return Array.from(map.values());
  }

  function findTemplateByTrigger(cmdInput) {
    const clean = String(cmdInput || '').trim().toUpperCase();
    if (!clean) return null;
    const withDot = clean.startsWith('.') ? clean : '.' + clean;
    return (
      templates.find(
        (t) =>
          t.command.toUpperCase() === withDot ||
          (Array.isArray(t.aliases) && t.aliases.includes(withDot))
      ) || null
    );
  }

  // ---------------------------------------------------------------------------
  // Navegación entre las 3 vistas de la SPA
  // ---------------------------------------------------------------------------
  function switchView(mode) {
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
  // Motor de Formato Rico (#### Títulos, **Negritas**, Viñetas) + Píldoras Verdes
  // ---------------------------------------------------------------------------
  function tokenizeInline(lineText) {
    // Reconoce **negrita** y {{Campo}} en la misma línea
    const tokens = [];
    const INLINE_RE = /\*\*([^*]+)\*\*|\{\{\s*([^{}]+?)\s*\}\}/g;
    let last = 0;
    const str = String(lineText || '');
    for (const m of str.matchAll(INLINE_RE)) {
      if (m.index > last) {
        tokens.push({ type: 'text', value: str.slice(last, m.index) });
      }
      if (m[1] !== undefined) {
        tokens.push({ type: 'bold', content: m[1] });
      } else if (m[2] !== undefined) {
        tokens.push({ type: 'field', name: m[2].trim() });
      }
      last = m.index + m[0].length;
    }
    if (last < str.length) {
      tokens.push({ type: 'text', value: str.slice(last) });
    }
    return tokens;
  }

  function resizePill(input) {
    pillMeasureSpan.textContent = input.value || input.placeholder || ' ';
    input.style.width = Math.max(pillMeasureSpan.offsetWidth + 8, 44) + 'px';
  }

  function renderSelectorControls() {
    templateSelect.textContent = '';
    for (const t of templates) {
      const opt = document.createElement('option');
      opt.value = t.command;
      const aliasStr =
        t.aliases && t.aliases.length ? ` / ${t.aliases.join(', ')}` : '';
      opt.textContent = `${t.command}${aliasStr} · ${t.label} (${t.category || 'General'})`;
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
    const found = findTemplateByTrigger(command) || templates[0];
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
      pillProgressText.textContent = '0 / 0';
      btnPrevPill.disabled = true;
      btnNextPill.disabled = true;
      return;
    }
    btnPrevPill.disabled = false;
    btnNextPill.disabled = false;
    const bounded = Math.min(Math.max(activePillIndex, 0), focusablePills.length - 1);
    pillProgressText.textContent = `${bounded + 1} / ${focusablePills.length}`;
  }

  function createPillInput(fieldName, groups) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'pill';
    input.placeholder = fieldName;
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', fieldName);
    input.value = valuesMap.get(fieldName) || '';

    const group = groups.get(fieldName) || [];
    const isPrimary = group.length === 0;
    input.tabIndex = isPrimary ? 0 : -1;
    group.push(input);
    groups.set(fieldName, group);

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

    input.addEventListener('input', () => {
      valuesMap.set(fieldName, input.value);
      for (const other of groups.get(fieldName)) {
        if (other !== input) other.value = input.value;
        resizePill(other);
      }
      updateAssembledPreview();
    });

    allPillInputs.push(input);
    return input;
  }

  function appendTokensToElement(container, lineStr, groups) {
    const tokens = tokenizeInline(lineStr);
    for (const tk of tokens) {
      if (tk.type === 'text') {
        container.appendChild(document.createTextNode(tk.value));
      } else if (tk.type === 'bold') {
        const strong = document.createElement('strong');
        strong.className = 'hc-bold';
        // Permitir placeholders también dentro de negrita si existieran
        appendTokensToElement(strong, tk.content, groups);
        container.appendChild(strong);
      } else if (tk.type === 'field') {
        container.appendChild(createPillInput(tk.name, groups));
      }
    }
  }

  function renderPillCanvas(shouldFocusFirst = true) {
    if (!activeTemplate) return;
    pillCanvas.textContent = '';
    allPillInputs = [];
    focusablePills = [];
    activePillIndex = 0;

    const groups = new Map();
    const lines = String(activeTemplate.body || '').split(/\r?\n/);

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed) {
        const spacer = document.createElement('div');
        spacer.className = 'hc-empty-line';
        pillCanvas.appendChild(spacer);
        continue;
      }

      // 1. Encabezados Markdown (#### Título:, ### Título, etc.)
      const headingMatch = rawLine.match(/^\s*#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const h4 = document.createElement('h4');
        h4.className = 'hc-heading';
        appendTokensToElement(h4, headingMatch[1], groups);
        pillCanvas.appendChild(h4);
        continue;
      }

      // 2. Viñetas de lista (- Elemento o * Elemento)
      const bulletMatch = rawLine.match(/^\s*[-*]\s+(.*)$/);
      if (bulletMatch) {
        const row = document.createElement('div');
        row.className = 'hc-bullet-line';
        const dot = document.createElement('span');
        dot.className = 'hc-bullet-dot';
        dot.textContent = '•';
        row.appendChild(dot);
        appendTokensToElement(row, bulletMatch[1], groups);
        pillCanvas.appendChild(row);
        continue;
      }

      // 3. Línea estándar (con soporte automático para etiquetas "Campo:" al inicio si no usan **)
      const lineDiv = document.createElement('div');
      lineDiv.className = 'hc-line';
      let processedLine = rawLine;
      if (!rawLine.includes('**')) {
        processedLine = rawLine.replace(
          /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s/(),-]{1,38}:)(\s|$)/,
          '**$1**$2'
        );
      }
      appendTokensToElement(lineDiv, processedLine, groups);
      pillCanvas.appendChild(lineDiv);
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

  // Navegación con Tab (ciclo cerrado entre píldoras verdes) y Enter
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
    const val = quickCommandInput.value.trim();
    if (!val) return;
    const match = findTemplateByTrigger(val);
    if (match) {
      quickCommandInput.value = '';
      selectActiveTemplateByCommand(match.command, true);
      showToast(`Plantilla ${match.command} (${match.label}) activa`);
    }
  });

  btnResetFields.addEventListener('click', () => {
    valuesMap.clear();
    renderPillCanvas(true);
    showToast('Campos limpiados');
  });

  // ---------------------------------------------------------------------------
  // Ensamblaje en Formato Rico (HTML), Markdown y Texto Limpio + Portapapeles
  // ---------------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function replaceFieldsInString(rawText) {
    return String(rawText || '').replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, name) => {
      return valuesMap.get(name.trim()) || '';
    });
  }

  function buildFormattedOutputs(templateBody) {
    const filledMarkdown = replaceFieldsInString(templateBody);
    const lines = filledMarkdown.split(/\r?\n/);
    const plainLines = [];
    const htmlParts = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        plainLines.push('');
        htmlParts.push('<div style="height:8px;"></div>');
        continue;
      }

      // Encabezado #### Título
      const headingMatch = line.match(/^\s*#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const cleanTitle = headingMatch[1].replace(/\*\*([^*]+)\*\*/g, '$1').trim();
        plainLines.push(cleanTitle.toUpperCase());
        htmlParts.push(
          `<h4 style="margin:12px 0 4px;font-size:14.5px;font-weight:700;">${escapeHtml(cleanTitle)}</h4>`
        );
        continue;
      }

      // Viñeta - Elemento
      const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        const plainContent = content.replace(/\*\*([^*]+)\*\*/g, '$1');
        plainLines.push(`- ${plainContent}`);
        const htmlContent = escapeHtml(content).replace(
          /\*\*([^*]+)\*\*/g,
          '<strong>$1</strong>'
        );
        htmlParts.push(`<div style="margin:2px 0 2px 12px;">• ${htmlContent}</div>`);
        continue;
      }

      // Línea normal con soporte de **negritas**
      const plainLine = line.replace(/\*\*([^*]+)\*\*/g, '$1');
      plainLines.push(plainLine);

      let lineWithBold = line;
      if (!line.includes('**')) {
        lineWithBold = line.replace(
          /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s/(),-]{1,38}:)(\s|$)/,
          '**$1**$2'
        );
      }
      const htmlLine = escapeHtml(lineWithBold).replace(
        /\*\*([^*]+)\*\*/g,
        '<strong>$1</strong>'
      );
      htmlParts.push(`<div style="margin:2px 0;">${htmlLine}</div>`);
    }

    return {
      markdown: filledMarkdown,
      plain: plainLines.join('\n'),
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.55;color:#0f172a;">${htmlParts.join('')}</div>`,
    };
  }

  function updateAssembledPreview() {
    if (!assembledPreviewRich || !activeTemplate) return;
    const out = buildFormattedOutputs(activeTemplate.body);
    const mode = copyFormatSelect ? copyFormatSelect.value : 'rich';
    if (mode === 'markdown') {
      assembledPreviewRich.textContent = out.markdown;
    } else if (mode === 'plain') {
      assembledPreviewRich.textContent = out.plain;
    } else {
      assembledPreviewRich.innerHTML = out.html;
    }
  }

  async function writeRichOrPlainToClipboard(outputs, mode = 'rich') {
    const textToCopy = mode === 'markdown' ? outputs.markdown : outputs.plain;

    try {
      if (
        mode === 'rich' &&
        navigator.clipboard &&
        typeof window.ClipboardItem !== 'undefined'
      ) {
        const htmlBlob = new Blob([outputs.html], { type: 'text/html' });
        const textBlob = new Blob([outputs.plain], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
        return true;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      }
    } catch (_) {}

    // Fallback universal para Safari / iPadOS
    const ta = document.createElement('textarea');
    ta.value = textToCopy;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, textToCopy.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (_) {}
    ta.remove();
    return ok;
  }

  async function copyCurrentTemplateToClipboard() {
    if (!activeTemplate) return;
    const outputs = buildFormattedOutputs(activeTemplate.body);
    const mode = copyFormatSelect ? copyFormatSelect.value : 'rich';
    const ok = await writeRichOrPlainToClipboard(outputs, mode);
    showToast(ok ? '✓ Copiado al portapapeles' : '⚠️ No se pudo copiar automáticamente');
  }

  btnCopyMain.addEventListener('click', copyCurrentTemplateToClipboard);

  btnInsertToSheet.addEventListener('click', async () => {
    if (!activeTemplate) return;
    const outputs = buildFormattedOutputs(activeTemplate.body);
    const mode = copyFormatSelect ? copyFormatSelect.value : 'rich';
    const blockText = mode === 'markdown' ? outputs.markdown : outputs.plain;
    const currentSheet = clinicalSheetTextarea.value.trim();
    clinicalSheetTextarea.value = currentSheet ? `${currentSheet}\n\n${blockText}` : blockText;
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
    } catch (_) {}
    noteInsertionCount++;
    noteBadge.hidden = false;
    noteBadge.textContent = String(noteInsertionCount);
    await writeRichOrPlainToClipboard(
      buildFormattedOutputs(clinicalSheetTextarea.value),
      mode
    );
    showToast('✓ Añadido a la Hoja Acumulada y copiado');
  });

  // ---------------------------------------------------------------------------
  // Vista 2: Hoja Clínica Acumulada (con detección de .PED, .MC, .EF, etc.)
  // ---------------------------------------------------------------------------
  clinicalSheetTextarea.addEventListener('input', () => {
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
    } catch (_) {}

    const pos = clinicalSheetTextarea.selectionStart;
    if (pos == null) return;
    const beforeCursor = clinicalSheetTextarea.value.slice(0, pos);
    const wordMatch = beforeCursor.match(/(?:^|\s)(\.[A-Za-z0-9_-]{2,15})$/);
    if (wordMatch) {
      const matchedTpl = findTemplateByTrigger(wordMatch[1]);
      if (matchedTpl) {
        const start = pos - wordMatch[1].length;
        clinicalSheetTextarea.setRangeText('', start, pos, 'end');
        localStorage.setItem(SHEET_STORAGE_KEY, clinicalSheetTextarea.value);
        switchView('expander');
        selectActiveTemplateByCommand(matchedTpl.command, true);
        showToast(`Plantilla ${matchedTpl.command} abierta`);
      }
    }
  });

  btnCopySheet.addEventListener('click', async () => {
    const raw = clinicalSheetTextarea.value.trim();
    if (!raw) {
      showToast('La hoja acumulada está vacía');
      return;
    }
    const outputs = buildFormattedOutputs(raw);
    const mode = copyFormatSelect ? copyFormatSelect.value : 'rich';
    const ok = await writeRichOrPlainToClipboard(outputs, mode);
    showToast(ok ? '✓ Hoja clínica copiada al portapapeles' : '⚠️ Error al copiar');
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
    showToast('Hoja clínica vaciada');
  });

  // ---------------------------------------------------------------------------
  // Vista 3: Constructor y Gestor Visual de Plantillas
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
    builderFormTitle.textContent = 'Nueva plantilla clínica';
    tplCommand.value = '.NOTA';
    tplLabel.value = 'Nueva Nota Clínica';
    tplCategory.value = 'General';
    tplBody.value =
      '#### Identificación:\n**Paciente:** {{Nombre}} · **Documento:** {{Documento}}\n\n#### Evaluación:\n{{Hallazgos}}\n\n#### Análisis y plan:\n{{Plan}}';
    btnDeleteTpl.disabled = true;
    btnDuplicateTpl.disabled = true;
    renderBuilderList();
    tplCommand.focus();
    tplCommand.select();
  }

  btnNewTemplate.addEventListener('click', startNewTemplateInBuilder);
  builderSearch.addEventListener('input', renderBuilderList);

  function insertTextAtBuilderCursor(snippet) {
    const start = tplBody.selectionStart ?? tplBody.value.length;
    const end = tplBody.selectionEnd ?? tplBody.value.length;
    tplBody.focus();
    tplBody.setRangeText(snippet, start, end, 'end');
  }

  function insertPlaceholderIntoBuilder(varName) {
    const clean = String(varName || '')
      .replace(/[{}]/g, '')
      .trim();
    if (!clean) return;
    insertTextAtBuilderCursor(`{{${clean}}}`);
  }

  if (btnFmtHeading) {
    btnFmtHeading.addEventListener('click', () => insertTextAtBuilderCursor('\n#### Nuevo título:\n'));
  }
  if (btnFmtBold) {
    btnFmtBold.addEventListener('click', () => insertTextAtBuilderCursor('**Etiqueta:** '));
  }
  if (btnFmtBullet) {
    btnFmtBullet.addEventListener('click', () => insertTextAtBuilderCursor('\n- '));
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
      showToast(`⚠️ El atajo ${cmd} ya existe en "${duplicate.label}"`);
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
    showToast(`✓ Plantilla ${cmd} guardada`);
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
    showToast(`Plantilla ${current.command} eliminada`);
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
    showToast('Catálogo JSON exportado');
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
      showToast(`✓ ${imported.length} plantillas importadas`);
    } catch (_) {
      showToast('⚠️ Archivo JSON inválido');
    }
  });

  btnRestoreDefaults.addEventListener('click', async () => {
    if (!confirm('¿Restaurar las plantillas oficiales (.PED, .MC, .EF, .EVO, .ORD)?')) return;
    const merged = mergeCatalogs(DEFAULT_TEMPLATES, templates, true);
    await saveCatalog(merged);
    selectActiveTemplateByCommand(templates[0].command, false);
    loadTemplateIntoBuilder(templates[0].id);
    showToast('✓ Catálogo oficial restaurado');
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
      showToast(`✓ ${validRemote.length} plantillas sincronizadas`);
    } catch (err) {
      showToast(`⚠️ Error: ${err.message}`);
    } finally {
      btnExecuteSync.disabled = false;
      btnExecuteSync.textContent = 'Sincronizar';
    }
  });

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
    setTimeout(() => el.remove(), 2400);
  }

  // ---------------------------------------------------------------------------
  // Inicialización de la Suite Clínica (SPA)
  // ---------------------------------------------------------------------------
  (async function initSpa() {
    templates = await loadCatalog();
    if (templates.length > 0) {
      selectActiveTemplateByCommand(templates[0].command, true);
      loadTemplateIntoBuilder(templates[0].id);
    }
  })();
})();
