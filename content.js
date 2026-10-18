(() => {
  'use strict';
  if (window.__hcExpanderLoaded) return;
  window.__hcExpanderLoaded = true;

  const STORAGE_KEY = 'hc_templates';

  // ---------------------------------------------------------------------------
  // Catálogo base de respaldo (si chrome.storage aún no ha inicializado).
  // Sintaxis de campos: {{Campo}}
  // ---------------------------------------------------------------------------
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

  let TEMPLATES = [...DEFAULT_TEMPLATES];
  const FIELD_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;
  let TRIGGER_RE = buildTriggerRegex(TEMPLATES);
  const Z_TOP = '2147483647';

  let modalOpen = false;
  let lastCommand = TEMPLATES[0] ? TEMPLATES[0].command : '.MC';

  function escapeRe(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function buildTriggerRegex(list) {
    const valid = (list || [])
      .map((t) => (t && t.command ? String(t.command).trim() : ''))
      .filter(Boolean)
      // Ordenar de mayor a menor longitud para evitar colisiones de prefijos (ej. .EV vs .EVO)
      .sort((a, b) => b.length - a.length);
    if (!valid.length) return /(?!)/;
    return new RegExp('(?:^|\\s)(' + valid.map(escapeRe).join('|') + ')$', 'i');
  }

  function applyTemplates(list) {
    if (!Array.isArray(list) || list.length === 0) return;
    const sanitized = list
      .filter((t) => t && typeof t.command === 'string' && typeof t.body === 'string')
      .map((t) => ({
        id: t.id || t.command,
        command: t.command.trim(),
        label: (t.label || t.command).trim(),
        category: (t.category || 'General').trim(),
        body: t.body,
      }))
      .filter((t) => t.command.length > 0);
    if (!sanitized.length) return;
    TEMPLATES = sanitized;
    TRIGGER_RE = buildTriggerRegex(TEMPLATES);
    if (!findTemplate(lastCommand)) {
      lastCommand = TEMPLATES[0].command;
    }
  }

  // Inicialización asíncrona desde chrome.storage.local y sincronización reactiva
  function initStorageSync() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      if (chrome.runtime && chrome.runtime.lastError) return;
      if (Array.isArray(res[STORAGE_KEY]) && res[STORAGE_KEY].length > 0) {
        applyTemplates(res[STORAGE_KEY]);
      } else {
        chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_TEMPLATES });
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY] && Array.isArray(changes[STORAGE_KEY].newValue)) {
        applyTemplates(changes[STORAGE_KEY].newValue);
      }
    });
  }

  initStorageSync();

  function findTemplate(command) {
    const c = String(command || '').toUpperCase();
    return TEMPLATES.find((t) => t.command.toUpperCase() === c) || null;
  }

  function parseTemplate(body) {
    const segments = [];
    let last = 0;
    for (const m of body.matchAll(FIELD_RE)) {
      if (m.index > last) segments.push({ type: 'text', value: body.slice(last, m.index) });
      segments.push({ type: 'field', name: m[1] });
      last = m.index + m[0].length;
    }
    if (last < body.length) segments.push({ type: 'text', value: body.slice(last) });
    return segments;
  }

  const isGoogleDocs = () => location.hostname === 'docs.google.com';

  function isTextInput(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && /^(text|search|url|tel|)$/i.test(el.getAttribute('type') || '');
  }

  function editableRoot(node) {
    let el = node && node.nodeType === Node.ELEMENT_NODE ? node : node && node.parentElement;
    if (!el || !el.isContentEditable) return null;
    while (el.parentElement && el.parentElement.isContentEditable) el = el.parentElement;
    return el;
  }

  function selectionFor(node) {
    const root = node.getRootNode();
    return (root.getSelection && root.getSelection()) || node.ownerDocument.getSelection();
  }

  // Elemento con foco real, atravesando shadow roots e iframes del mismo origen.
  function getDeepActive() {
    let el = document.activeElement;
    const frames = [];
    while (el) {
      if (el.shadowRoot && el.shadowRoot.activeElement) {
        el = el.shadowRoot.activeElement;
        continue;
      }
      if (el.tagName === 'IFRAME') {
        let doc = null;
        try {
          doc = el.contentDocument;
        } catch (_) {}
        if (doc && doc.activeElement) {
          frames.push(el);
          el = doc.activeElement;
          continue;
        }
      }
      break;
    }
    return { el, frames };
  }

  // Contexto de inserción cuando el modal se abre con Alt+M (sin comando disparador).
  function captureContext() {
    const { el, frames } = getDeepActive();
    if (isGoogleDocs()) return { kind: 'docs', el, frames };
    if (isTextInput(el) && el.selectionStart != null) {
      return { kind: 'input', el, start: el.selectionStart, end: el.selectionEnd };
    }
    const root = editableRoot(el);
    if (root) {
      const sel = selectionFor(root);
      const range = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      return { kind: 'editable', el: root, frames, range };
    }
    return { kind: 'none', el, frames };
  }

  // ---------------------------------------------------------------------------
  // Detección de comandos al escribir
  // ---------------------------------------------------------------------------
  function onInput(e) {
    if (modalOpen || e.isComposing) return;
    const target = e.composedPath ? e.composedPath()[0] : e.target;
    if (!target || target.nodeType !== Node.ELEMENT_NODE) return;

    if (isTextInput(target)) {
      const pos = target.selectionStart;
      if (pos == null || target.selectionEnd !== pos) return;
      const m = target.value.slice(0, pos).match(TRIGGER_RE);
      if (!m) return;
      const trigger = m[1];
      const ctx = { kind: 'input', el: target, start: pos - trigger.length, end: pos, trigger };
      setTimeout(() => openModal(findTemplate(trigger), ctx), 0);
      return;
    }

    const root = editableRoot(target);
    if (!root) return;
    const sel = selectionFor(root);
    if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    const node = sel.anchorNode;
    const offset = sel.anchorOffset;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const m = node.data.slice(0, offset).match(TRIGGER_RE);
    if (!m) return;
    const trigger = m[1];
    const range = node.ownerDocument.createRange();
    range.setStart(node, offset - trigger.length);
    range.setEnd(node, offset);
    const ctx = { kind: 'editable', el: root, frames: getDeepActive().frames, range, trigger };
    setTimeout(() => openModal(findTemplate(trigger), ctx), 0);
  }

  // ---------------------------------------------------------------------------
  // Atajo Option+M / Alt+M
  // ---------------------------------------------------------------------------
  function onKeyDown(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.code !== 'KeyM') return;
    e.preventDefault();
    e.stopPropagation();
    if (modalOpen) return;
    openModal(findTemplate(lastCommand), captureContext());
  }

  window.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('input', onInput, true);

  // Los eventos de teclado de iframes del mismo origen (p. ej. el iframe de texto
  // de Google Docs) no llegan a la ventana principal: se escuchan directamente.
  const hookedDocs = new WeakSet();
  function hookFrames() {
    for (const frame of document.querySelectorAll('iframe')) {
      let doc = null;
      try {
        doc = frame.contentDocument;
      } catch (_) {}
      if (!doc || hookedDocs.has(doc)) continue;
      hookedDocs.add(doc);
      doc.addEventListener('keydown', onKeyDown, true);
      if (!isGoogleDocs()) doc.addEventListener('input', onInput, true);
    }
  }
  hookFrames();
  setInterval(hookFrames, 2000);
  window.addEventListener('blur', () => setTimeout(hookFrames, 0));

  // ---------------------------------------------------------------------------
  // Modal (Shadow DOM)
  // ---------------------------------------------------------------------------
  const MODAL_CSS = `
    :host { all: initial; }
    .overlay {
      position: fixed; inset: 0; z-index: ${Z_TOP};
      display: flex; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.35);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .dialog {
      display: flex; flex-direction: column;
      width: min(680px, calc(100vw - 32px)); max-height: calc(100vh - 48px);
      background: #fff; color: #1f2328;
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
    }
    header { padding: 20px 24px 12px; }
    .header-top {
      display: flex; align-items: center; justify-content: space-between;
      margin: 0 0 12px; gap: 12px;
    }
    h2 { margin: 0; font-size: 17px; font-weight: 600; }
    .manage-btn {
      padding: 4px 10px; font-size: 12.5px; font-weight: 500;
      color: #475569; background: #f8fafc; border: 1px solid #cbd5e1;
      border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
    }
    .manage-btn:hover { background: #f1f5f9; color: #0f172a; }
    select {
      width: 100%; box-sizing: border-box; padding: 8px 10px;
      font: inherit; font-size: 14px; color: inherit;
      background: #fff; border: 1px solid #d0d7de; border-radius: 8px;
    }
    select:focus { outline: 2px solid #001aff; outline-offset: 1px; }
    .body {
      padding: 6px 24px 18px; overflow: auto;
      font-size: 14px; line-height: 2.1;
      white-space: pre-wrap; overflow-wrap: break-word;
    }
    .pill {
      box-sizing: border-box; max-width: 100%; margin: 0 1px; padding: 1px 8px;
      font: inherit; font-size: 13.5px; line-height: 1.4; vertical-align: baseline;
      color: #188038; background: #e8f8ee;
      border: 1px solid #34a853; border-radius: 999px; outline: none;
    }
    .pill::placeholder { color: #188038; opacity: 0.6; }
    .pill:focus { box-shadow: 0 0 0 3px rgba(52, 168, 83, 0.28); }
    .measure { position: absolute; left: -9999px; top: 0; visibility: hidden; white-space: pre; }
    footer {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 24px 18px; border-top: 1px solid #eef0f2;
    }
    .hint { flex: 1; font-size: 12px; color: #6e7781; }
    button {
      padding: 8px 18px; font: inherit; font-size: 14px; font-weight: 600;
      border: 1px solid transparent; border-radius: 8px; cursor: pointer;
    }
    button:focus-visible { outline: 2px solid #001aff; outline-offset: 2px; }
    .cancel { color: #1f2328; background: #fff; border-color: #d0d7de; }
    .cancel:hover { background: #f6f8fa; }
    .insert { color: #fff; background: #001aff; }
    .insert:hover { background: #0014cc; }
  `;

  function openOptionsPage() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    }
  }

  function openModal(template, ctx) {
    if (modalOpen) return;
    modalOpen = true;
    template = template || TEMPLATES[0] || DEFAULT_TEMPLATES[0];

    const host = document.createElement('hc-expander-modal');
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>${MODAL_CSS}</style>
      <div class="overlay">
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="hc-title">
          <header>
            <div class="header-top">
              <h2 id="hc-title">Completar campos de la plantilla</h2>
              <button type="button" class="manage-btn" title="Crear, editar o compartir plantillas">⚙️ Gestionar plantillas</button>
            </div>
            <select aria-label="Formato de historia clínica"></select>
          </header>
          <div class="body"></div>
          <footer>
            <span class="hint">Tab: siguiente · Enter: insertar · Esc: cancelar</span>
            <button type="button" class="cancel">Cancelar</button>
            <button type="button" class="insert">Insertar</button>
          </footer>
        </div>
      </div>`;

    const overlay = shadow.querySelector('.overlay');
    const dialog = shadow.querySelector('.dialog');
    const select = shadow.querySelector('select');
    const manageBtn = shadow.querySelector('.manage-btn');
    const body = shadow.querySelector('.body');
    const cancelBtn = shadow.querySelector('.cancel');
    const insertBtn = shadow.querySelector('.insert');
    const measure = document.createElement('span');
    measure.className = 'pill measure';
    shadow.appendChild(measure);

    for (const t of TEMPLATES) {
      const opt = document.createElement('option');
      opt.value = t.command;
      opt.textContent = `${t.command} · ${t.label}`;
      select.appendChild(opt);
    }
    select.value = template.command;

    // Los valores se conservan al cambiar de formato si el campo se llama igual.
    const values = new Map();
    let segments = [];
    let inputs = [];
    let submitting = false;

    function resize(input) {
      measure.textContent = input.value || input.placeholder || ' ';
      input.style.width = measure.offsetWidth + 4 + 'px';
    }

    function render() {
      segments = parseTemplate(template.body);
      body.textContent = '';
      inputs = [];
      const groups = new Map();
      for (const seg of segments) {
        if (seg.type === 'text') {
          body.appendChild(document.createTextNode(seg.value));
          continue;
        }
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'pill';
        input.placeholder = seg.name;
        input.spellcheck = false;
        input.autocomplete = 'off';
        input.value = values.get(seg.name) || '';
        const group = groups.get(seg.name) || [];
        // Solo la primera aparición de cada variable entra en el orden de Tab.
        input.tabIndex = group.length ? -1 : 0;
        group.push(input);
        groups.set(seg.name, group);
        input.addEventListener('input', () => {
          values.set(seg.name, input.value);
          for (const other of groups.get(seg.name)) {
            if (other !== input) other.value = input.value;
            resize(other);
          }
        });
        body.appendChild(input);
        inputs.push(input);
      }
      inputs.forEach(resize);
    }

    function focusFirst() {
      const first = inputs.find((i) => i.tabIndex === 0) || select;
      first.focus();
      return first;
    }

    function assemble() {
      return segments
        .map((seg) => (seg.type === 'text' ? seg.value : values.get(seg.name) || ''))
        .join('');
    }

    function close() {
      host.remove();
      modalOpen = false;
    }

    function cancel() {
      close();
      restoreFocus(ctx);
    }

    async function submit() {
      if (submitting) return;
      submitting = true;
      const text = assemble();
      const copied = await copyToClipboard(text, shadow);
      close();
      await insertText(ctx, text, copied);
    }

    select.addEventListener('change', () => {
      template = findTemplate(select.value) || TEMPLATES[0];
      lastCommand = template.command;
      render();
      focusFirst();
    });
    manageBtn.addEventListener('click', () => {
      close();
      openOptionsPage();
    });
    cancelBtn.addEventListener('click', cancel);
    insertBtn.addEventListener('click', submit);

    dialog.addEventListener('keydown', (e) => {
      const t = e.composedPath()[0];
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        if (t.tagName === 'BUTTON' || t.tagName === 'SELECT') return;
        e.preventDefault();
        submit();
      } else if (e.key === 'Tab') {
        // Mantiene el foco dentro del modal y navega impecablemente por las píldoras verdes.
        const order = [select, ...inputs.filter((i) => i.tabIndex === 0), cancelBtn, insertBtn];
        const idx = order.indexOf(shadow.activeElement);
        if (!e.shiftKey && idx === order.length - 1) {
          e.preventDefault();
          order[0].focus();
        } else if (e.shiftKey && idx === 0) {
          e.preventDefault();
          order[order.length - 1].focus();
        }
      }
    });

    // Aísla el modal de los atajos y manejadores de la página anfitriona.
    for (const type of ['keydown', 'keyup', 'keypress', 'beforeinput', 'input', 'paste', 'copy', 'cut', 'mousedown', 'mouseup', 'pointerdown', 'click', 'focusin', 'focusout']) {
      overlay.addEventListener(type, (e) => e.stopPropagation());
    }

    document.documentElement.appendChild(host);
    lastCommand = template.command;
    render();

    // Algunas apps (Google Docs) recuperan el foco justo después del atajo.
    let attempts = 0;
    const grabFocus = () => {
      if (!modalOpen || shadow.activeElement) return;
      focusFirst();
      if (++attempts < 5) setTimeout(grabFocus, 40);
    };
    setTimeout(grabFocus, 0);
  }

  // ---------------------------------------------------------------------------
  // Portapapeles e inserción
  // ---------------------------------------------------------------------------
  async function copyToClipboard(text, root) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
      root.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (_) {}
      ta.remove();
      return ok;
    }
  }

  const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

  function focusFrames(frames) {
    for (const f of frames || []) {
      try {
        f.focus();
        f.contentWindow.focus();
      } catch (_) {}
    }
  }

  function syntheticPaste(target, text) {
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const ev = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    target.dispatchEvent(ev);
    return ev.defaultPrevented;
  }

  function restoreFocus(ctx) {
    if (!ctx || !ctx.el) return;
    focusFrames(ctx.frames);
    try {
      ctx.el.focus();
      if (ctx.kind === 'input' && ctx.el.isConnected) {
        ctx.el.setSelectionRange(ctx.end, ctx.end);
      } else if (ctx.kind === 'editable' && ctx.range && ctx.range.startContainer.isConnected) {
        const sel = selectionFor(ctx.el);
        const r = ctx.range.cloneRange();
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    } catch (_) {}
  }

  async function insertText(ctx, text, copied) {
    switch (ctx && ctx.kind) {
      case 'input':
        return insertIntoInput(ctx, text);
      case 'editable':
        return insertIntoEditable(ctx, text);
      case 'docs':
        return insertIntoDocs(ctx, text, copied);
      default:
        toast(copied ? '✓ Copiado al portapapeles' : 'No se pudo copiar al portapapeles');
    }
  }

  function insertIntoInput(ctx, text) {
    const el = ctx.el;
    if (!el.isConnected) return toast('✓ Copiado al portapapeles');
    el.focus();
    let { start, end } = ctx;
    // Si el texto cambió mientras el modal estaba abierto, no borra nada ajeno.
    if (ctx.trigger && el.value.slice(start, end).toUpperCase() !== ctx.trigger.toUpperCase()) {
      start = end = el.selectionStart;
    }
    el.setSelectionRange(start, end);
    let ok = false;
    try {
      ok = el.ownerDocument.execCommand('insertText', false, text);
    } catch (_) {}
    if (!ok) {
      el.setRangeText(text, start, end, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    }
  }

  function insertIntoEditable(ctx, text) {
    const el = ctx.el;
    if (!el.isConnected) return toast('✓ Copiado al portapapeles');
    focusFrames(ctx.frames);
    el.focus();
    const sel = selectionFor(el);
    const r = ctx.range;
    const rangeValid =
      r &&
      r.startContainer.isConnected &&
      (!ctx.trigger || r.toString().toUpperCase() === ctx.trigger.toUpperCase());
    if (rangeValid) {
      sel.removeAllRanges();
      sel.addRange(r);
    }
    // Editores como Notion manejan el pegado (respetan bloques y saltos de línea);
    // si nadie lo procesa, se inserta el texto de forma nativa.
    const anchor = sel.anchorNode;
    const target = (anchor && (anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement)) || el;
    if (syntheticPaste(target, text)) return;
    try {
      el.ownerDocument.execCommand('insertText', false, text);
    } catch (_) {}
  }

  async function insertIntoDocs(ctx, text, copied) {
    const frame =
      (ctx.frames && ctx.frames[0]) || document.querySelector('iframe.docs-texteventtarget-iframe');
    let innerDoc = null;
    try {
      innerDoc = frame && frame.contentDocument;
    } catch (_) {}
    focusFrames(frame ? [frame] : []);
    const target =
      (ctx.el && ctx.el.isConnected && ctx.el.ownerDocument === innerDoc && ctx.el) ||
      (innerDoc && (innerDoc.querySelector('[contenteditable="true"]') || innerDoc.body));
    if (target) target.focus();
    await tick(30);

    let pasted = false;
    for (const doc of [innerDoc, document]) {
      if (!doc || pasted) continue;
      try {
        pasted = doc.execCommand('paste');
      } catch (_) {}
    }
    if (!pasted && target) pasted = syntheticPaste(target, text);

    if (pasted) toast('✓ Texto insertado y copiado al portapapeles');
    else if (copied) toast('✓ Copiado — pega con ⌘V / Ctrl+V');
    else toast('No se pudo copiar al portapapeles');
  }

  // ---------------------------------------------------------------------------
  // Aviso flotante
  // ---------------------------------------------------------------------------
  function toast(message) {
    const host = document.createElement('hc-expander-toast');
    const shadow = host.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .toast {
          position: fixed; left: 50%; bottom: 32px; z-index: ${Z_TOP};
          transform: translate(-50%, 12px); opacity: 0;
          padding: 10px 18px; border-radius: 10px;
          background: #1f2328; color: #fff;
          font: 500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }
        .toast.show { opacity: 1; transform: translate(-50%, 0); }
      </style>
      <div class="toast" role="status"></div>`;
    const el = shadow.querySelector('.toast');
    el.textContent = message;
    document.documentElement.appendChild(host);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => host.remove(), 250);
    }, 2200);
  }
})();
