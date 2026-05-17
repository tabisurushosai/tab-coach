import { applyI18nToDom } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import {
  filterDuplicateHostnames,
  filterInactive,
  queryAllSnapshots,
} from '@/lib/tabs';
import { normalizeReadUrl } from '@/lib/reading';
import { getMany } from '@/lib/storage';
import type { Settings, TabSnapshot } from '@/types/storage';

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

async function closeTab(snapshot: TabSnapshot, li: HTMLLIElement): Promise<void> {
  if (snapshot.id < 0) return;
  try {
    await chrome.tabs.remove(snapshot.id);
    state.snapshots = state.snapshots.filter((s) => s.id !== snapshot.id);
    li.remove();
    updateCounts();
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

function selectCategory(category: Category): void {
  if (state.category === category) return;
  state.category = category;
  const buttons = document.querySelectorAll<HTMLButtonElement>('.category-tab');
  buttons.forEach((btn) => {
    const isMatch = btn.dataset['category'] === category;
    btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
  });
  renderList();
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
}

function init(): void {
  applyI18nToDom(document);
  bindCategoryTabs();
  void loadAndRender();
  logger.info('popup loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
