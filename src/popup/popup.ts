import { applyI18nToDom, t } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import {
  applyFontScale,
  applyHighContrast,
  applyTheme,
  installSystemThemeListener,
} from '@/lib/theme';
import { isDarkModeValue } from '@/lib/settings';
import {
  filterDuplicateHostnames,
  filterInactive,
  pickDuplicateClosable,
  queryAllSnapshots,
} from '@/lib/tabs';
import { normalizeReadUrl } from '@/lib/reading';
import { getMany } from '@/lib/storage';
import {
  clearIfExpired,
  clearUndoSnapshot,
  createUndoSnapshot,
  loadUndoSnapshot,
  saveUndoSnapshot,
} from '@/lib/snapshot';
import { matchesWhitelist } from '@/lib/whitelist';
import { addArchivedTabs } from '@/lib/archive';
import { recordCleanup, type CleanupCategory } from '@/lib/report';
import type { Settings, TabSnapshot, WhitelistEntry } from '@/types/storage';

const FALLBACK_FAVICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
      '<rect width="16" height="16" rx="3" fill="%23d1d5db"/>' +
      '</svg>',
  );

type Category = 'all' | 'inactive' | 'duplicate' | 'read';
const CATEGORIES: readonly Category[] = ['all', 'inactive', 'duplicate', 'read'];

function categoryToCleanupCategory(category: Category): CleanupCategory {
  if (category === 'inactive' || category === 'duplicate' || category === 'read') {
    return category;
  }
  return 'manual';
}

type PopupState = {
  category: Category;
  snapshots: TabSnapshot[];
  settings: Settings;
  readCompleted: Record<string, number>;
  whitelist: WhitelistEntry[];
  searchQuery: string;
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
  whitelist: [],
  searchQuery: '',
};

function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase();
}

function snapshotMatchesQuery(snapshot: TabSnapshot, query: string): boolean {
  if (query === '') return true;
  const title = (snapshot.title || '').toLowerCase();
  if (title.includes(query)) return true;
  const url = (snapshot.url || '').toLowerCase();
  return url.includes(query);
}

function applySearchFilter(snapshots: readonly TabSnapshot[], query: string): TabSnapshot[] {
  if (query === '') return [...snapshots];
  return snapshots.filter((s) => snapshotMatchesQuery(s, query));
}

function filterByCategory(
  snapshots: readonly TabSnapshot[],
  category: Category,
  settings: Settings,
  readCompleted: Record<string, number>,
  whitelist: readonly WhitelistEntry[],
): TabSnapshot[] {
  if (category === 'all') return [...snapshots];
  let candidates: TabSnapshot[];
  if (category === 'inactive') {
    candidates = filterInactive(snapshots, settings.inactiveMinutes);
  } else if (category === 'duplicate') {
    candidates = filterDuplicateHostnames(snapshots);
  } else {
    candidates = snapshots.filter((s) => {
      const key = normalizeReadUrl(s.url);
      return key !== null && readCompleted[key] !== undefined;
    });
  }
  if (whitelist.length === 0) return candidates;
  return candidates.filter((s) => !matchesWhitelist(s.url, whitelist));
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
  whitelist: readonly WhitelistEntry[],
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
  return candidates.filter((s) => s.id >= 0 && !s.pinned && !matchesWhitelist(s.url, whitelist));
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

type UndoBarMode = 'cleanup' | 'archive';

function renderUndoBar(
  closedCount: number,
  expiresAt: number,
  mode: UndoBarMode = 'cleanup',
): void {
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
  const messageKey = mode === 'archive' ? 'archive_notice' : 'undo_notice';
  messageEl.textContent = t(messageKey, [String(closedCount)]);
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
    countdownEl.textContent = t('popup_undo_countdown_format', [String(seconds)]);
  };
  tick();
  clearUndoTimer();
  undoTimerId = window.setInterval(tick, 250);
}

async function clearExpiredUndoSnapshot(): Promise<void> {
  try {
    await clearIfExpired();
  } catch (err) {
    logger.error('clearExpiredUndoSnapshot failed', err);
  }
}

async function runUndo(): Promise<void> {
  const undoBtn = document.getElementById('undo-button');
  if (undoBtn instanceof HTMLButtonElement) undoBtn.disabled = true;
  try {
    const snapshot = await loadUndoSnapshot();
    if (snapshot === null) {
      hideUndoBar();
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
    await clearUndoSnapshot();
  } catch (err) {
    logger.error('runUndo failed', err);
  }
  hideUndoBar();
  await loadAndRender();
}

async function runArchive(): Promise<void> {
  const targets = applySearchFilter(
    pickCleanupTargets(
      state.category,
      state.snapshots,
      state.settings,
      state.readCompleted,
      state.whitelist,
    ),
    state.searchQuery,
  );
  if (targets.length === 0) return;
  const ids = targets.map((t) => t.id);
  const removedIds = new Set<number>(ids);
  const archiveBtn = document.getElementById('archive-button');
  const cleanupBtn = document.getElementById('cleanup-button');
  if (archiveBtn instanceof HTMLButtonElement) archiveBtn.disabled = true;
  if (cleanupBtn instanceof HTMLButtonElement) cleanupBtn.disabled = true;
  const undoSnapshot = createUndoSnapshot(targets);
  try {
    await addArchivedTabs(targets);
  } catch (err) {
    logger.error('addArchivedTabs failed', err);
    updateCleanupButton();
    return;
  }
  try {
    await saveUndoSnapshot(undoSnapshot);
  } catch (err) {
    logger.error('save undoSnapshot failed', err);
  }
  let removed = false;
  try {
    await chrome.tabs.remove(ids);
    state.snapshots = state.snapshots.filter((s) => !removedIds.has(s.id));
    removed = true;
  } catch (err) {
    logger.error('archive remove failed', err);
  }
  if (removed) {
    renderUndoBar(targets.length, undoSnapshot.expiresAt, 'archive');
    try {
      await recordCleanup(targets.length, 'manual');
    } catch (err) {
      logger.error('recordCleanup (archive) failed', err);
    }
  } else {
    try {
      await clearUndoSnapshot();
    } catch (err) {
      logger.error('rollback undoSnapshot failed', err);
    }
  }
  updateCounts();
  renderList();
  updateCleanupButton();
}

async function runCleanup(): Promise<void> {
  const targets = applySearchFilter(
    pickCleanupTargets(
      state.category,
      state.snapshots,
      state.settings,
      state.readCompleted,
      state.whitelist,
    ),
    state.searchQuery,
  );
  if (targets.length === 0) return;
  const ids = targets.map((t) => t.id);
  const removedIds = new Set<number>(ids);
  const button = document.getElementById('cleanup-button');
  if (button instanceof HTMLButtonElement) button.disabled = true;
  const undoSnapshot = createUndoSnapshot(targets);
  try {
    await saveUndoSnapshot(undoSnapshot);
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
    try {
      await recordCleanup(targets.length, categoryToCleanupCategory(state.category));
    } catch (err) {
      logger.error('recordCleanup (cleanup) failed', err);
    }
  } else {
    try {
      await clearUndoSnapshot();
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
  button.setAttribute(
    'aria-label',
    t('popup_activate_tab_label', [snapshot.title || snapshot.url]),
  );
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
  const closeLabel = t('popup_close_tab_label');
  closeBtn.setAttribute('aria-label', closeLabel);
  closeBtn.title = closeLabel;
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    void closeTab(snapshot, li);
  });

  li.appendChild(button);
  li.appendChild(closeBtn);
  return li;
}

function renderEmpty(list: HTMLElement, message?: string): void {
  const li = document.createElement('li');
  li.className = 'empty';
  li.setAttribute('role', 'listitem');
  li.textContent = message ?? t('list_empty_placeholder');
  list.appendChild(li);
}

function renderList(): void {
  const list = document.getElementById('tab-list');
  if (!(list instanceof HTMLElement)) return;

  const byCategory = filterByCategory(
    state.snapshots,
    state.category,
    state.settings,
    state.readCompleted,
    state.whitelist,
  );
  const filtered = applySearchFilter(byCategory, state.searchQuery);

  list.setAttribute('aria-busy', 'true');
  list.setAttribute('aria-label', t('popup_tab_list_aria_label', [String(filtered.length)]));
  list.replaceChildren();
  if (filtered.length === 0) {
    const empty =
      state.searchQuery !== '' && byCategory.length > 0
        ? t('search_no_match')
        : t('list_empty_placeholder');
    renderEmpty(list, empty);
    list.setAttribute('aria-busy', 'false');
    return;
  }
  const frag = document.createDocumentFragment();
  for (const snap of filtered) {
    frag.appendChild(createTabItem(snap));
  }
  list.appendChild(frag);
  list.setAttribute('aria-busy', 'false');
}

function updateCounts(): void {
  const totalEl = document.getElementById('count');
  if (totalEl) {
    const totalVisible =
      state.searchQuery === ''
        ? state.snapshots.length
        : applySearchFilter(state.snapshots, state.searchQuery).length;
    totalEl.textContent = String(totalVisible);
  }

  for (const cat of CATEGORIES) {
    const span = document.querySelector<HTMLElement>(`[data-count-for="${cat}"]`);
    if (!span) continue;
    const byCategory = filterByCategory(
      state.snapshots,
      cat,
      state.settings,
      state.readCompleted,
      state.whitelist,
    );
    const count = applySearchFilter(byCategory, state.searchQuery).length;
    span.textContent = count > 0 ? ` (${count})` : '';
  }
}

function updateCleanupButton(): void {
  const cleanupBtn = document.getElementById('cleanup-button');
  const archiveBtn = document.getElementById('archive-button');
  const targets = applySearchFilter(
    pickCleanupTargets(
      state.category,
      state.snapshots,
      state.settings,
      state.readCompleted,
      state.whitelist,
    ),
    state.searchQuery,
  );
  const empty = targets.length === 0;
  if (cleanupBtn instanceof HTMLButtonElement) cleanupBtn.disabled = empty;
  if (archiveBtn instanceof HTMLButtonElement) archiveBtn.disabled = empty;
  const countEl = document.getElementById('cleanup-count');
  if (countEl) countEl.textContent = targets.length > 0 ? ` (${targets.length})` : '';
  const archiveCountEl = document.getElementById('archive-count');
  if (archiveCountEl) archiveCountEl.textContent = targets.length > 0 ? ` (${targets.length})` : '';
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

function bindSearchInput(): void {
  const input = document.getElementById('search-input');
  const bar = document.getElementById('search-bar');
  const clearBtn = document.getElementById('search-clear');
  if (!(input instanceof HTMLInputElement)) return;
  const updateClearVisibility = (raw: string): void => {
    if (bar instanceof HTMLElement) {
      bar.dataset['hasQuery'] = raw.length > 0 ? 'true' : 'false';
    }
  };
  input.addEventListener('input', () => {
    const normalized = normalizeSearchQuery(input.value);
    updateClearVisibility(input.value);
    if (normalized === state.searchQuery) return;
    state.searchQuery = normalized;
    updateCounts();
    renderList();
    updateCleanupButton();
  });
  if (clearBtn instanceof HTMLButtonElement) {
    clearBtn.addEventListener('click', () => {
      if (input.value === '' && state.searchQuery === '') return;
      input.value = '';
      updateClearVisibility('');
      state.searchQuery = '';
      updateCounts();
      renderList();
      updateCleanupButton();
      input.focus();
    });
  }
}

function bindCleanupButton(): void {
  const button = document.getElementById('cleanup-button');
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener('click', () => {
    void runCleanup();
  });
}

function bindArchiveButton(): void {
  const button = document.getElementById('archive-button');
  if (!(button instanceof HTMLButtonElement)) return;
  button.addEventListener('click', () => {
    void runArchive();
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
    const snapshot = await loadUndoSnapshot();
    if (snapshot === null) return;
    renderUndoBar(snapshot.tabs.length, snapshot.expiresAt);
  } catch (err) {
    logger.error('restoreUndoBarFromStorage failed', err);
  }
}

async function loadAndRender(): Promise<void> {
  try {
    const [snapshots, stored] = await Promise.all([
      queryAllSnapshots(),
      getMany(['settings', 'readCompleted', 'whitelist'] as const),
    ]);
    state.snapshots = snapshots;
    state.settings = stored.settings;
    state.readCompleted = stored.readCompleted;
    state.whitelist = stored.whitelist;
    applyTheme(stored.settings.darkMode);
    applyFontScale(stored.settings.fontScale);
    applyHighContrast(stored.settings.highContrast === true);
  } catch (err) {
    logger.error('popup load failed', err);
  }
  updateCounts();
  renderList();
  updateCleanupButton();
}

function bindThemeListeners(): void {
  installSystemThemeListener(() => {
    if (state.settings.darkMode === 'auto') {
      applyTheme('auto');
    }
  });
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const settingsChange = changes['settings'];
    if (!settingsChange) return;
    const next = (settingsChange.newValue ?? null) as {
      darkMode?: unknown;
      fontScale?: unknown;
      highContrast?: unknown;
    } | null;
    if (next && isDarkModeValue(next.darkMode)) {
      state.settings = { ...state.settings, darkMode: next.darkMode };
      applyTheme(next.darkMode);
    }
    if (next && typeof next.fontScale === 'number' && Number.isFinite(next.fontScale)) {
      state.settings = { ...state.settings, fontScale: next.fontScale };
      applyFontScale(next.fontScale);
    }
    if (next && typeof next.highContrast === 'boolean') {
      state.settings = { ...state.settings, highContrast: next.highContrast };
      applyHighContrast(next.highContrast);
    }
  });
}

function init(): void {
  applyTheme(state.settings.darkMode);
  applyFontScale(state.settings.fontScale);
  applyI18nToDom(document);
  bindSearchInput();
  bindCategoryTabs();
  bindCleanupButton();
  bindArchiveButton();
  bindUndoButton();
  bindThemeListeners();
  void loadAndRender();
  void restoreUndoBarFromStorage();
  logger.info('popup loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
