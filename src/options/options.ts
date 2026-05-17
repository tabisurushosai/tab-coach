import { applyI18nToDom, getUILocale, t, type MessageKey } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import {
  addWhitelistEntry,
  loadWhitelist,
  removeWhitelistEntry,
} from '@/lib/whitelist';
import type { WhitelistEntry } from '@/types/storage';

const ERROR_MESSAGE_KEY: Record<string, MessageKey> = {
  empty: 'whitelist_error_empty',
  too_long: 'whitelist_error_too_long',
  duplicate: 'whitelist_error_duplicate',
  limit_reached: 'whitelist_error_limit',
};

function formatCreatedAt(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const locale = getUILocale() === 'ja' ? 'ja-JP' : 'en-US';
  try {
    return new Date(ms).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

function getListEl(): HTMLUListElement | null {
  const el = document.getElementById('whitelist-list');
  return el instanceof HTMLUListElement ? el : null;
}

function setError(key: MessageKey | null): void {
  const errEl = document.getElementById('whitelist-error');
  if (!(errEl instanceof HTMLElement)) return;
  errEl.textContent = key === null ? '' : t(key);
}

function createItem(entry: WhitelistEntry): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'whitelist-item';
  li.setAttribute('role', 'listitem');
  li.dataset['pattern'] = entry.pattern;

  const body = document.createElement('div');
  body.className = 'whitelist-item-body';

  const pattern = document.createElement('div');
  pattern.className = 'whitelist-item-pattern';
  pattern.textContent = entry.pattern;
  body.appendChild(pattern);

  const metaParts: string[] = [];
  const created = formatCreatedAt(entry.createdAt);
  if (created) metaParts.push(created);
  if (entry.note) metaParts.push(entry.note);
  if (metaParts.length > 0) {
    const meta = document.createElement('div');
    meta.className = 'whitelist-item-meta';
    meta.textContent = metaParts.join(' · ');
    body.appendChild(meta);
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'whitelist-remove-button';
  removeBtn.textContent = t('whitelist_remove_button');
  removeBtn.setAttribute('aria-label', `${t('whitelist_remove_button')}: ${entry.pattern}`);
  removeBtn.addEventListener('click', () => {
    void handleRemove(entry.pattern);
  });

  li.appendChild(body);
  li.appendChild(removeBtn);
  return li;
}

function renderEmpty(list: HTMLUListElement): void {
  const li = document.createElement('li');
  li.className = 'whitelist-empty';
  li.setAttribute('role', 'listitem');
  li.textContent = t('whitelist_empty');
  list.appendChild(li);
}

function renderList(entries: readonly WhitelistEntry[]): void {
  const list = getListEl();
  if (!list) return;
  list.replaceChildren();
  if (entries.length === 0) {
    renderEmpty(list);
    return;
  }
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const frag = document.createDocumentFragment();
  for (const entry of sorted) {
    frag.appendChild(createItem(entry));
  }
  list.appendChild(frag);
}

async function handleAdd(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const patternInput = document.getElementById('whitelist-pattern');
  const noteInput = document.getElementById('whitelist-note');
  const submitBtn = document.getElementById('whitelist-add-button');
  if (!(patternInput instanceof HTMLInputElement)) return;

  const pattern = patternInput.value;
  const note = noteInput instanceof HTMLInputElement ? noteInput.value : '';

  if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = true;
  try {
    const result = await addWhitelistEntry(pattern, note);
    if (!result.ok) {
      setError(ERROR_MESSAGE_KEY[result.reason] ?? 'whitelist_error_empty');
      return;
    }
    setError(null);
    patternInput.value = '';
    if (noteInput instanceof HTMLInputElement) noteInput.value = '';
    renderList(result.entries);
    patternInput.focus();
  } catch (err) {
    logger.error('whitelist add failed', err);
  } finally {
    if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = false;
  }
}

async function handleRemove(pattern: string): Promise<void> {
  try {
    const next = await removeWhitelistEntry(pattern);
    renderList(next);
    setError(null);
  } catch (err) {
    logger.error('whitelist remove failed', err);
  }
}

async function loadAndRender(): Promise<void> {
  try {
    const entries = await loadWhitelist();
    renderList(entries);
  } catch (err) {
    logger.error('whitelist load failed', err);
    renderList([]);
  }
}

function bindForm(): void {
  const form = document.getElementById('whitelist-form');
  if (!(form instanceof HTMLFormElement)) return;
  form.addEventListener('submit', (ev) => {
    void handleAdd(ev as SubmitEvent);
  });
}

function init(): void {
  applyI18nToDom(document);
  bindForm();
  void loadAndRender();
  logger.info('options loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
