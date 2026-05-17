import { applyI18nToDom } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import { queryAllSnapshots } from '@/lib/tabs';
import type { TabSnapshot } from '@/types/storage';

const FALLBACK_FAVICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
      '<rect width="16" height="16" rx="3" fill="%23d1d5db"/>' +
      '</svg>',
  );

function createTabItem(snapshot: TabSnapshot): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'tab-item';
  li.setAttribute('role', 'listitem');
  li.dataset['tabId'] = String(snapshot.id);

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
  title.title = snapshot.url;

  li.appendChild(img);
  li.appendChild(title);
  return li;
}

function renderEmpty(list: HTMLElement): void {
  const li = document.createElement('li');
  li.className = 'empty';
  li.setAttribute('role', 'listitem');
  li.textContent = '—';
  list.appendChild(li);
}

async function renderTabList(): Promise<void> {
  const list = document.getElementById('tab-list');
  const countEl = document.getElementById('count');
  if (!(list instanceof HTMLElement)) return;

  list.replaceChildren();

  let snapshots: TabSnapshot[] = [];
  try {
    snapshots = await queryAllSnapshots();
  } catch (err) {
    logger.error('popup queryAllSnapshots failed', err);
  }

  if (countEl) countEl.textContent = String(snapshots.length);

  if (snapshots.length === 0) {
    renderEmpty(list);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const snap of snapshots) {
    frag.appendChild(createTabItem(snap));
  }
  list.appendChild(frag);
}

function init(): void {
  applyI18nToDom(document);
  void renderTabList();
  logger.info('popup loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
