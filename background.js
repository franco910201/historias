'use strict';

const STORAGE_KEY = 'hc_templates';

async function loadDefaultTemplates() {
  try {
    const url = chrome.runtime.getURL('templates.json');
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[HC Expander] Error cargando templates.json:', err);
    return [];
  }
}

async function ensureTemplatesSeeded() {
  const data = await chrome.storage.local.get([STORAGE_KEY]);
  if (!Array.isArray(data[STORAGE_KEY]) || data[STORAGE_KEY].length === 0) {
    const defaults = await loadDefaultTemplates();
    if (defaults.length > 0) {
      await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  ensureTemplatesSeeded();
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'RESET_DEFAULT_TEMPLATES') {
    loadDefaultTemplates().then(async (defaults) => {
      await chrome.storage.local.set({ [STORAGE_KEY]: defaults });
      sendResponse({ ok: true, templates: defaults });
    });
    return true;
  }

  return false;
});
