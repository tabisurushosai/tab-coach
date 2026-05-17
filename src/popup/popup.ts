import { applyI18nToDom, t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import {
  filterDuplicateHostnames,
  filterInactive,
  pickDuplicateClosable,
  queryAllSnapshots,
} from '@/lib/tabs';
import { normalizeReadUrl } from '@/lib/reading';
import { get, getMany, set } from '@/lib/storage';
import type { Settings, TabSnapshot, UndoSnapshot } from '@/types/storage';

const UNDO_WINDOW_MS = 30_000;

const FALLBACK_FAVICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
      '<rect width="16" height="16" rx="3" fill="%23d1d5db"/>' +
      '</svg>',
  );

type Category = 'all' | 'inactive' | 'duplicate' | 'read';
const CATEGORIES: readonly Category[] = ['all', 'inactive', 'duplicate', 'read'];

type PopupState = {
  category: Category;
  snapshots: TabSnapshot[];
  settings: Settings;
  readCompleted: Record<string, number>;
};

const state: PopupState = {
  category: 'all',
  snapshots: [],
  settings: {
    tabLimitYellow: 10,
    tabLimitRed: 20,
    inactiveMinutes: 30,
    darkMode: 'auto',
    fontScale: 1.0,
    highContrast: false,
  },
  readCompleted: {},
};

function filterByCategory(
  snapshots: readonly TabSnapshot[],
  category: Category,
  settings: Settings,
  readCompleted: Record<string, number>,
): TabSnapshot[] {
  if (category === 'all') return [...snapshots];
  if (category === 'inactive') {
    return filterInactive(snapshots, settings.inactiveMinutes);
  }
  if (category === 'duplicate') {
    return filterDuplicateHostnames(snapshots);
  }
  return snapshots.filter((s) => {
    const key = normalizeReadUrl(s.url);
    return key !== null && readCompleted[key] !== undefined;
  });
}

async function activateTab(snapshot: TabSnapshot): Promise<void> {
  if (snapshot.id < 0) return;
  try {
    await chrome.tabs.update(snapshot.id, { active: true });
    if (typeof snapshot.windowId === 'number' && snapshot.windowId >= 0) {
      await chrome.windows.update(snapshot.windowId, { focused: true });
    }
    window.close();
  } catch (err) {
    logger.error('activateTab failed', err);
  }
}

function pickCleanupTargets(
  category: Category,
  snapshots: readonly TabSnapshot[],
  settings: Settings,
  readCompleted: Record<string, number>,
): TabSnapshot[] {
  if (category === 'all') return [];
  let candidates: TabSnapshot[];
  if (category === 'inactive') {
    candidates = filterInactive(snapshots, settings.inactiveMinutes);
  } else if (category === 'duplicate') {
    candidates = pickDuplicateClosable(snapshots);
  } else {
    candidates = snapshots.filter((s) => {
      const key = normalizeReadUrl(s.url);
      return key !== null && readCompleted[key] !== undefined;
    });
  }
  return candidates.filter((s) => s.id >= 0 && !s.pinned);
}

let undoTimerId: number | null = null;

function clearUndoTimer(): void {
  if (undoTimerId !== null) {
    window.clearInterval(undoTimerId);
    undoTimerId = null;
  }
}

function hideUndoBar(): void {
  clearUndoTimer();
  const bar = document.getElementById('undo-bar');
  if (bar instanceof HTMLElement) bar.dataset['visible'] = 'false';
}

function renderUndoBar(closedCount: number, expiresAt: number): void {
  const bar = document.getElementById('undo-bar');
  const messageEl = document.getElementById('undo-message-text');
  const countdownEl = document.getElementById('undo-countdown');
  const undoBtn = document.getElementById('undo-button');
  if (
    !(bar instanceof HTMLElement) ||
    !(messageEl instanceof HTMLElement) ||
    !(countdownEl instanceof HTMLElement) ||
    !(undoBtn instanceof HTMLButtonElement)
  ) {
    return;
  }
  messageEl.textContent = t('undo_notice', [String(closedCount)]);
  undoBtn.disabled = false;
  bar.dataset['visible'] = 'true';

  const tick = (): void => {
    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      hideUndoBar();
      void clearExpiredUndoSnapshot();
      return;
    }
    const seconds = Math.ceil(remainingMs / 1000);
    countdownEl.textContent = ` (${seconds}s)`;
  };
  tick();
  clearUndoTimer();
  undoTimerId = window.setInterval(tick, 250);
}

async function clearExpiredUndoSnapshot(): Promise<void> {
  try {
    const current = await get('undoSnapshot');
    if (current !== null && current.expiresAt <= Date.now()) {
      await set('undoSnapshot', null);
    }
  } catch (err) {
    logger.error('clearExpiredUndoSnapshot failed', err);
  }
}

async function runUndo(): Promise<void> {
  const undoBtn = document.getElementById('undo-button');
  if (undoBtn instanceof HTMLButtonElement) undoBtn.disabled = true;
  try {
    const snapshot = await get('undoSnapshot');
    if (snapshot === null || snapshot.expiresAt <= Date.now()) {
      hideUndoBar();
      await set('undoSnapshot', null);
      return;
    }
    for (const tab of snapshot.tabs) {
      if (!tab.url) continue;
      const createInfo: chrome.tabs.CreateProperties = {
        url: tab.url,
        active: false,
      };
      if (typeof tab.windowId === 'number' && tab.windowId >= 0) {
        createInfo.windowId = tab.windowId;
      }
      if (tab.pinned === true) createInfo.pinned = true;
      try {
        await chrome.tabs.create(createInfo);
      } catch (err) {
        logger.error('undo create failed', err, tab.url);
      }
    }
    await set('undoSnapshot', null);
  } catch (err) {
    logger.error('runUndo failed', err);
  }
  hideUndoBar();
  await loadAndRender();
}

async function runCleanup(): Promise<void> {
  const targets = pickCleanupTargets(
    state.category,
    state.snapshots,
    state.settings,
    state.readCompleted,
  );
  if (targets.length === 0) return;
  const ids = targets.map((t) => t.id);
  const removedIds = new Set<number>(ids);
  const button = document.getElementById('cleanup-button');
  if (button instanceof HTMLButtonElement) button.disabled = true;
  const now = Date.now();
  const undoSnapshot: UndoSnapshot = {
    at: now,
    tabs: targets.map((s) => ({ ...s })),
    expiresAt: now + UNDO_WINDOW_MS,
  };
  try {
    await set('undoSnapshot', undoSnapshot);
  } catch (err) {
    logger.error('save undoSnapshot failed', err);
  }
  let removed = false;
  try {
    await chrome.tabs.remove(ids);
    state.snapshots = state.snapshots.filter((s) => !removedIds.has(s.id));
    removed = true;
  } catch (err) {
    logger.error('cleanup failed', err);
  }
  if (removed) {
    renderUndoBar(targets.length, undoSnapshot.expiresAt);
  } else {
    try {
      await set('undoSnapshot', null);
    } catch (err) {
      logger.error('rollback undoSnapshot failed', err);
    }
  }
  updateCounts();
  renderList();
  updateCleanupButton();
}

async function closeTab(snapshot: TabSnapshot, li: HTMLLIElement): Promise<void> {
  if (snapshot.id < 0) return;
  try {
    await chrome.tabs.remove(snapshot.id);
    state.snapshots = state.snapshots.filter((s) => s.id !== snapshot.id);
    li.remove();
    updateCounts();
    updateCleanupButton();
    const list = document.getElementById('tab-list');
    if (list instanceof HTMLElement && list.childElementCount === 0) {
      renderEmpty(list);
    }
  } catch (err) {
    logger.error('closeTab failed', err);
  }
}

function createTabItem(snapshot: TabSnapshot): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'tab-item';
  li.setAttribute('role', 'listitem');
  li.dataset['tabId'] = String(snapshot.id);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tab-button';
  button.title = snapshot.url;
  button.addEventListener('click', () => {
    void activateTab(snapshot);
  });

  const img = document.createElement('img');
  img.className = 'tab-favicon';
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.src = snapshot.favIconUrl ?? FALLBACK_FAVICON;
  img.addEventListener(
    'error',
    () => {
      img.src = FALLBACK_FAVICON;
    },
    { once: true },
  );

  const title = document.createElement('span');
  title.className = 'tab-title';
  title.textContent = snapshot.title || snapshot.url;

  button.appendChild(img);
  button.appendChild(title);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'tab-close';
  closeBtn.setAttribute('aria-label', 'Close tab');
  closeBtn.title = 'Close tab';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    void closeTab(snapshot, li);
  });

  li.appendChild(button);
  li.appendChild(closeBtn);
  return li;
}

function renderEmpty(list: HTMLElement): void {
  const li = document.createElement('li');
  li.className = 'empty';
  li.setAttribute('role', 'listitem');
  li.textContent = '—';
  list.appendChild(li);
}

function renderList(): void {
  const list = document.getElementById('tab-list');
  if (!(list instanceof HTMLElement)) return;

  const filtered = filterByCategory(
    state.snapshots,
    state.category,
    state.settings,
    state.readCompleted,
  );

  list.replaceChildren();
  if (filtered.length === 0) {
    renderEmpty(list);
    return;
  }
  const frag = document.createDocumentFragment();
  for (const snap of filtered) {
    frag.appendChild(createTabItem(snap));
  }
  list.appendChild(frag);
}

function updateCounts(): void {
  const totalEl = document.getElementById('count');
  if (totalEl) totalEl.textContent = String(state.snapshots.length);

  for (const cat of CATEGORIES) {
    const span = document.querySelector<HTMLElement>(`[data-count-for="${cat}"]`);
    if (!span) continue;
    const count = filterByCategory(state.snapshots, cat, state.settings, state.readCompleted).length;
    span.textContent = count > 0 ? ` (${count})` : '';
  }
}

function updateCleanupButton(): void {
  const button = document.getElementById('cleanup-button');
  if (!(button instanceof HTMLButtonElement)) return;
  const targets = pickCleanupTargets(
    state.category,
    state.snapshots,
    state.settings,
    state.readCompleted,
  );
  button.disabled = targets.length === 0;
  const countEl = document.getElementById('cleanup-count');
  if (countEl) countEl.textContent = targets.length > 0 ? ` (${targets.length})` : '';
}

function selectCategory(category: Category): void {
  if (state.category === category) return;
  state.category = category;
  const buttons = document.querySelectorAll<HTMLButtonElement>('.category-tab');
  buttons.forEach((btn) => {
    const isMatch = btn.dataset['category'] === category;
    btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  renderList();
  updateCleanupButton();
}

function bindCategoryTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.category-tab');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset['category'];
      if (cat && (CATEGORIES as readonly string[]).includes(cat)) {
        selectCategory(cat as Category);
      }
    });
  });
}

function bindCleanupButton(): void {
  const button = document.getElementById('cleanup-button');
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener('click', () => {
    void runCleanup();
  });
}

function bindUndoButton(): void {
  const undoBtn = document.getElementById('undo-button');
  if (!(undoBtn instanceof HTMLButtonElement)) return;
  undoBtn.addEventListener('click', () => {
    void runUndo();
  });
}

async function restoreUndoBarFromStorage(): Promise<void> {
  try {
    const snapshot = await get('undoSnapshot');
    if (snapshot === null) return;
    if (snapshot.expiresAt <= Date.now()) {
      await set('undoSnapshot', null);
      return;
    }
    renderUndoBar(snapshot.tabs.length, snapshot.expiresAt);
  } catch (err) {
    logger.error('restoreUndoBarFromStorage failed', err);
  }
}

async function loadAndRender(): Promise<void> {
  try {
    const [snapshots, stored] = await Promise.all([
      queryAllSnapshots(),
      getMany(['settings', 'readCompleted'] as const),
    ]);
    state.snapshots = snapshots;
    state.settings = stored.settings;
    state.readCompleted = stored.readCompleted;
  } catch (err) {
    logger.error('popup load failed', err);
  }
  updateCounts();
  renderList();
  updateCleanupButton();
}

function init(): void {
  applyI18nToDom(document);
  bindCategoryTabs();
  bindCleanupButton();
  bindUndoButton();
  void loadAndRender();
  void restoreUndoBarFromStorage();
  logger.info('popup loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
