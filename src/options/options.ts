import {
  buildArchiveExportFilename,
  importArchivedTabs,
  loadArchive,
  parseArchiveImport,
  removeArchivedTab,
  serializeArchiveExport,
  type ArchiveImportParseError,
} from '@/lib/archive';
import { refreshBadge } from '@/lib/badge';
import { applyI18nToDom, getUILocale, t, type MessageKey } from '@/lib/i18n';
import { logger } from '@/lib/logger';
import {
  isDarkModeValue,
  loadSettings,
  resetFontScale,
  resetInactiveMinutes,
  resetThresholds,
  saveDarkMode,
  saveFontScale,
  saveInactiveMinutes,
  saveThresholds,
  validateFontScale,
  validateInactiveMinutes,
  validateThresholds,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
  type DarkModeValue,
  type InactiveMinutesValidationError,
  type ThresholdValidationError,
} from '@/lib/settings';
import {
  applyFontScale,
  applyTheme,
  getCurrentResolvedTheme,
  installSystemThemeListener,
} from '@/lib/theme';
import { DEFAULT_SETTINGS } from '@/types/storage';
import {
  addWhitelistEntry,
  loadWhitelist,
  removeWhitelistEntry,
} from '@/lib/whitelist';
import {
  aggregateRecentMonths,
  getCurrentMonthReport,
  loadCleanupHistory,
  type MonthlyReport,
} from '@/lib/report';
import { groupTabsByDomain, type GroupingError } from '@/lib/grouping';
import type { ArchivedTab, Settings, WhitelistEntry } from '@/types/storage';

const THRESHOLD_ERROR_KEY: Record<ThresholdValidationError, MessageKey> = {
  yellow_invalid: 'thresholds_error_yellow_invalid',
  red_invalid: 'thresholds_error_red_invalid',
  red_not_greater: 'thresholds_error_red_not_greater',
};

const INACTIVE_ERROR_KEY: Record<InactiveMinutesValidationError, MessageKey> = {
  inactive_invalid: 'inactive_error_invalid',
};

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

function getThresholdInputs(): {
  yellow: HTMLInputElement | null;
  red: HTMLInputElement | null;
} {
  const yellow = document.getElementById('thresholds-yellow');
  const red = document.getElementById('thresholds-red');
  return {
    yellow: yellow instanceof HTMLInputElement ? yellow : null,
    red: red instanceof HTMLInputElement ? red : null,
  };
}

function setThresholdStatus(message: string, isError: boolean): void {
  const el = document.getElementById('thresholds-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

function applyThresholdValuesToInputs(settings: Settings): void {
  const { yellow, red } = getThresholdInputs();
  if (yellow) yellow.value = String(settings.tabLimitYellow);
  if (red) red.value = String(settings.tabLimitRed);
}

async function refreshBadgeQuietly(): Promise<void> {
  try {
    await refreshBadge();
  } catch (err) {
    logger.error('refreshBadge after threshold change failed', err);
  }
}

async function handleThresholdSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const { yellow, red } = getThresholdInputs();
  if (!yellow || !red) return;
  const saveBtn = document.getElementById('thresholds-save-button');

  const result = validateThresholds(yellow.value, red.value);
  if (!result.ok) {
    setThresholdStatus(t(THRESHOLD_ERROR_KEY[result.reason]), true);
    return;
  }

  if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = true;
  try {
    const next = await saveThresholds(result.value);
    applyThresholdValuesToInputs(next);
    setThresholdStatus(t('thresholds_saved_notice'), false);
    await refreshBadgeQuietly();
  } catch (err) {
    logger.error('threshold save failed', err);
  } finally {
    if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = false;
  }
}

async function handleThresholdReset(): Promise<void> {
  const resetBtn = document.getElementById('thresholds-reset-button');
  if (resetBtn instanceof HTMLButtonElement) resetBtn.disabled = true;
  try {
    const next = await resetThresholds();
    applyThresholdValuesToInputs(next);
    setThresholdStatus(t('thresholds_saved_notice'), false);
    await refreshBadgeQuietly();
  } catch (err) {
    logger.error('threshold reset failed', err);
  } finally {
    if (resetBtn instanceof HTMLButtonElement) resetBtn.disabled = false;
  }
}

function bindThresholdForm(): void {
  const form = document.getElementById('thresholds-form');
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', (ev) => {
      void handleThresholdSubmit(ev as SubmitEvent);
    });
  }
  const resetBtn = document.getElementById('thresholds-reset-button');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      void handleThresholdReset();
    });
  }
}

async function loadAndRenderThresholds(): Promise<void> {
  try {
    const settings = await loadSettings();
    applyThresholdValuesToInputs(settings);
    applyInactiveValueToInput(settings);
    applyDarkModeFromSettings(settings.darkMode);
    applyFontScaleFromSettings(settings.fontScale);
  } catch (err) {
    logger.error('threshold load failed', err);
  }
}

function getInactiveInput(): HTMLInputElement | null {
  const el = document.getElementById('inactive-minutes');
  return el instanceof HTMLInputElement ? el : null;
}

function setInactiveStatus(message: string, isError: boolean): void {
  const el = document.getElementById('inactive-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

function applyInactiveValueToInput(settings: Settings): void {
  const input = getInactiveInput();
  if (input) input.value = String(settings.inactiveMinutes);
}

async function handleInactiveSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const input = getInactiveInput();
  if (!input) return;
  const saveBtn = document.getElementById('inactive-save-button');

  const result = validateInactiveMinutes(input.value);
  if (!result.ok) {
    setInactiveStatus(t(INACTIVE_ERROR_KEY[result.reason]), true);
    return;
  }

  if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = true;
  try {
    const next = await saveInactiveMinutes(result.value);
    applyInactiveValueToInput(next);
    setInactiveStatus(t('inactive_saved_notice'), false);
  } catch (err) {
    logger.error('inactive minutes save failed', err);
  } finally {
    if (saveBtn instanceof HTMLButtonElement) saveBtn.disabled = false;
  }
}

async function handleInactiveReset(): Promise<void> {
  const resetBtn = document.getElementById('inactive-reset-button');
  if (resetBtn instanceof HTMLButtonElement) resetBtn.disabled = true;
  try {
    const next = await resetInactiveMinutes();
    applyInactiveValueToInput(next);
    setInactiveStatus(t('inactive_saved_notice'), false);
  } catch (err) {
    logger.error('inactive minutes reset failed', err);
  } finally {
    if (resetBtn instanceof HTMLButtonElement) resetBtn.disabled = false;
  }
}

function bindInactiveForm(): void {
  const form = document.getElementById('inactive-form');
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', (ev) => {
      void handleInactiveSubmit(ev as SubmitEvent);
    });
  }
  const resetBtn = document.getElementById('inactive-reset-button');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      void handleInactiveReset();
    });
  }
}

const ARCHIVE_FALLBACK_FAVICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
      '<rect width="16" height="16" rx="3" fill="%23d1d5db"/>' +
      '</svg>',
  );

function getArchiveListEl(): HTMLUListElement | null {
  const el = document.getElementById('archive-list');
  return el instanceof HTMLUListElement ? el : null;
}

function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function createArchiveItem(entry: ArchivedTab): HTMLLIElement {
  const li = document.createElement('li');
  li.className = 'archive-item';
  li.setAttribute('role', 'listitem');

  const favicon = document.createElement('img');
  favicon.className = 'archive-item-favicon';
  favicon.alt = '';
  favicon.referrerPolicy = 'no-referrer';
  favicon.src = entry.favIconUrl && entry.favIconUrl.length > 0
    ? entry.favIconUrl
    : ARCHIVE_FALLBACK_FAVICON;
  favicon.addEventListener('error', () => {
    favicon.src = ARCHIVE_FALLBACK_FAVICON;
  });

  const body = document.createElement('div');
  body.className = 'archive-item-body';

  const title = document.createElement('div');
  title.className = 'archive-item-title';
  title.textContent = entry.title || entry.url;
  title.title = entry.title || entry.url;
  body.appendChild(title);

  const urlEl = document.createElement('div');
  urlEl.className = 'archive-item-url';
  urlEl.textContent = entry.url;
  urlEl.title = entry.url;
  body.appendChild(urlEl);

  const meta = document.createElement('div');
  meta.className = 'archive-item-meta';
  meta.textContent = formatCreatedAt(entry.archivedAt);
  body.appendChild(meta);

  li.appendChild(favicon);
  li.appendChild(body);

  if (isSafeUrl(entry.url)) {
    const actions = document.createElement('div');
    actions.className = 'archive-actions';

    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.className = 'archive-restore-button';
    restoreBtn.textContent = t('archive_restore_button');
    restoreBtn.setAttribute('aria-label', `${t('archive_restore_label')}: ${entry.url}`);
    restoreBtn.addEventListener('click', () => {
      void handleRestore(entry, restoreBtn);
    });
    actions.appendChild(restoreBtn);

    const openLink = document.createElement('a');
    openLink.className = 'archive-open-button';
    openLink.href = entry.url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = '↗';
    openLink.setAttribute('aria-label', `${t('archive_open_link_label')}: ${entry.url}`);
    actions.appendChild(openLink);

    li.appendChild(actions);
  }

  return li;
}

async function handleRestore(entry: ArchivedTab, button: HTMLButtonElement): Promise<void> {
  if (!isSafeUrl(entry.url)) return;
  button.disabled = true;
  try {
    if (typeof chrome === 'undefined' || !chrome.tabs?.create) {
      logger.error('chrome.tabs.create unavailable');
      button.disabled = false;
      return;
    }
    await chrome.tabs.create({ url: entry.url, active: false });
    const next = await removeArchivedTab(entry.archivedAt, entry.url);
    renderArchive(next);
  } catch (err) {
    logger.error('archive restore failed', err);
    button.disabled = false;
  }
}

function renderArchiveEmpty(list: HTMLUListElement): void {
  const li = document.createElement('li');
  li.className = 'archive-empty';
  li.setAttribute('role', 'listitem');
  li.textContent = t('archive_empty');
  list.appendChild(li);
}

function setArchiveCount(count: number): void {
  const el = document.getElementById('archive-count');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = count > 0 ? t('archive_count_label', [String(count)]) : '';
}

function renderArchive(entries: readonly ArchivedTab[]): void {
  const list = getArchiveListEl();
  if (!list) return;
  list.replaceChildren();
  setArchiveCount(entries.length);
  if (entries.length === 0) {
    renderArchiveEmpty(list);
    return;
  }
  const sorted = [...entries].sort((a, b) => b.archivedAt - a.archivedAt);
  const frag = document.createDocumentFragment();
  for (const entry of sorted) {
    frag.appendChild(createArchiveItem(entry));
  }
  list.appendChild(frag);
}

async function loadAndRenderArchive(): Promise<void> {
  try {
    const entries = await loadArchive();
    renderArchive(entries);
  } catch (err) {
    logger.error('archive load failed', err);
    renderArchive([]);
  }
}

function bindArchiveStorageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!Object.prototype.hasOwnProperty.call(changes, 'archive')) return;
    void loadAndRenderArchive();
  });
}

function setArchiveStatus(message: string, isError: boolean): void {
  const el = document.getElementById('archive-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

function triggerJsonDownload(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function handleArchiveExport(): Promise<void> {
  const btn = document.getElementById('archive-export-button');
  if (btn instanceof HTMLButtonElement) btn.disabled = true;
  try {
    const entries = await loadArchive();
    if (entries.length === 0) {
      setArchiveStatus(t('archive_export_empty_notice'), true);
      return;
    }
    const exportedAt = Date.now();
    const json = serializeArchiveExport(entries, exportedAt);
    const filename = buildArchiveExportFilename(exportedAt);
    triggerJsonDownload(filename, json);
    setArchiveStatus(t('archive_export_success_notice', [String(entries.length)]), false);
  } catch (err) {
    logger.error('archive export failed', err);
    setArchiveStatus(t('archive_export_error_notice'), true);
  } finally {
    if (btn instanceof HTMLButtonElement) btn.disabled = false;
  }
}

function bindArchiveExportButton(): void {
  const btn = document.getElementById('archive-export-button');
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.addEventListener('click', () => {
    void handleArchiveExport();
  });
}

const MAX_ARCHIVE_IMPORT_BYTES = 5 * 1024 * 1024;

const ARCHIVE_IMPORT_ERROR_KEY: Record<ArchiveImportParseError, MessageKey> = {
  invalid_json: 'archive_import_error_invalid_json',
  invalid_shape: 'archive_import_error_invalid_shape',
  unsupported_version: 'archive_import_error_unsupported_version',
  no_entries: 'archive_import_error_no_entries',
};

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('FileReader returned non-string result'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsText(file);
  });
}

async function handleArchiveImportFile(file: File): Promise<void> {
  if (file.size > MAX_ARCHIVE_IMPORT_BYTES) {
    setArchiveStatus(t('archive_import_error_too_large'), true);
    return;
  }
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch (err) {
    logger.error('archive import read failed', err);
    setArchiveStatus(t('archive_import_error_read_failed'), true);
    return;
  }
  const parsed = parseArchiveImport(text);
  if (!parsed.ok) {
    setArchiveStatus(t(ARCHIVE_IMPORT_ERROR_KEY[parsed.reason]), true);
    return;
  }
  try {
    const result = await importArchivedTabs(parsed.payload.entries);
    renderArchive(result.entries);
    if (result.added === 0) {
      setArchiveStatus(t('archive_import_all_duplicate_notice'), false);
    } else {
      setArchiveStatus(
        t('archive_import_success_notice', [String(result.added), String(result.skipped)]),
        false,
      );
    }
  } catch (err) {
    logger.error('archive import save failed', err);
    setArchiveStatus(t('archive_import_error_read_failed'), true);
  }
}

function bindArchiveImportButton(): void {
  const btn = document.getElementById('archive-import-button');
  const input = document.getElementById('archive-import-file');
  if (!(btn instanceof HTMLButtonElement)) return;
  if (!(input instanceof HTMLInputElement)) return;
  btn.addEventListener('click', () => {
    input.value = '';
    input.click();
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;
    btn.disabled = true;
    void handleArchiveImportFile(file).finally(() => {
      btn.disabled = false;
      input.value = '';
    });
  });
}

const REPORT_MONTHS = 12;

function formatSavedTimeLabel(savedSeconds: number): string {
  if (!Number.isFinite(savedSeconds) || savedSeconds <= 0) {
    return t('report_saved_time_zero');
  }
  const totalMinutes = Math.floor(savedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return t('report_saved_time_format', [String(hours), String(minutes)]);
}

function getMonthShortLabel(year: number, month: number): string {
  const locale = getUILocale() === 'ja' ? 'ja-JP' : 'en-US';
  try {
    const d = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(d);
  } catch {
    return String(month);
  }
}

function getChartColors(): {
  axis: string;
  grid: string;
  text: string;
  bar: string;
  barCurrent: string;
} {
  const isDark = getCurrentResolvedTheme() === 'dark';
  if (isDark) {
    return {
      axis: 'rgba(255, 255, 255, 0.32)',
      grid: 'rgba(255, 255, 255, 0.08)',
      text: '#9ca3af',
      bar: '#60a5fa',
      barCurrent: '#3b82f6',
    };
  }
  return {
    axis: 'rgba(0, 0, 0, 0.32)',
    grid: 'rgba(0, 0, 0, 0.06)',
    text: '#6b7280',
    bar: '#3b82f6',
    barCurrent: '#1d4ed8',
  };
}

function drawMonthlyChart(canvas: HTMLCanvasElement, reports: readonly MonthlyReport[]): void {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssWidth = canvas.clientWidth || canvas.width;
  const cssHeight = canvas.clientHeight || canvas.height;
  if (cssWidth <= 0 || cssHeight <= 0) return;
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const colors = getChartColors();
  const paddingLeft = 40;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const plotWidth = cssWidth - paddingLeft - paddingRight;
  const plotHeight = cssHeight - paddingTop - paddingBottom;
  if (plotWidth <= 0 || plotHeight <= 0) return;

  const ordered = [...reports].reverse();
  const counts = ordered.map((r) => r.closedTotal);
  const maxRaw = counts.reduce((a, b) => Math.max(a, b), 0);
  const maxValue = maxRaw <= 0 ? 1 : Math.max(5, Math.ceil(maxRaw / 5) * 5);
  const gridSteps = 4;

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = colors.text;
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= gridSteps; i += 1) {
    const value = Math.round((maxValue * i) / gridSteps);
    const y = paddingTop + plotHeight - (plotHeight * i) / gridSteps;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(paddingLeft + plotWidth, y);
    ctx.stroke();
    ctx.fillText(String(value), paddingLeft - 6, y);
  }

  ctx.strokeStyle = colors.axis;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, paddingTop + plotHeight);
  ctx.lineTo(paddingLeft + plotWidth, paddingTop + plotHeight);
  ctx.stroke();

  if (ordered.length === 0) return;
  const slotWidth = plotWidth / ordered.length;
  const barWidth = Math.max(2, Math.min(28, slotWidth * 0.6));
  const lastIndex = ordered.length - 1;

  ctx.textAlign = 'center';
  for (let i = 0; i < ordered.length; i += 1) {
    const report = ordered[i];
    if (!report) continue;
    const slotX = paddingLeft + slotWidth * i + slotWidth / 2;
    const value = report.closedTotal;
    const barHeight = value > 0 ? (plotHeight * value) / maxValue : 0;
    const barY = paddingTop + plotHeight - barHeight;
    ctx.fillStyle = i === lastIndex ? colors.barCurrent : colors.bar;
    ctx.fillRect(slotX - barWidth / 2, barY, barWidth, barHeight);

    ctx.fillStyle = colors.text;
    ctx.textBaseline = 'top';
    ctx.fillText(getMonthShortLabel(report.year, report.month), slotX, paddingTop + plotHeight + 6);
  }
}

function applyCurrentMonthSummary(report: MonthlyReport): void {
  const cleanupsEl = document.getElementById('report-current-cleanups');
  if (cleanupsEl instanceof HTMLElement) {
    cleanupsEl.textContent = t('report_summary_cleanups', [String(report.cleanupCount)]);
  }
  const closedEl = document.getElementById('report-current-closed');
  if (closedEl instanceof HTMLElement) {
    closedEl.textContent = t('report_summary_closed', [String(report.closedTotal)]);
  }
  const savedEl = document.getElementById('report-current-saved-time');
  if (savedEl instanceof HTMLElement) {
    savedEl.textContent = formatSavedTimeLabel(report.savedSeconds);
  }
}

function setChartEmptyVisible(visible: boolean): void {
  const el = document.getElementById('report-chart-empty');
  if (el instanceof HTMLElement) el.dataset['visible'] = visible ? 'true' : 'false';
}

function renderReport(): Promise<void> {
  return loadCleanupHistory()
    .then((history) => {
      const now = Date.now();
      const current = getCurrentMonthReport(history, now);
      applyCurrentMonthSummary(current);
      const recent = aggregateRecentMonths(history, REPORT_MONTHS, now);
      const canvas = document.getElementById('report-chart');
      if (canvas instanceof HTMLCanvasElement) {
        drawMonthlyChart(canvas, recent);
      }
      const hasData = history.length > 0;
      setChartEmptyVisible(!hasData);
    })
    .catch((err) => {
      logger.error('report load failed', err);
    });
}

function bindReportStorageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    if (!Object.prototype.hasOwnProperty.call(changes, 'cleanupHistory')) return;
    void renderReport();
  });
}

function bindReportColorSchemeListener(): void {
  installSystemThemeListener(() => {
    void renderReport();
  });
}

let currentDarkMode: DarkModeValue = 'auto';

function setDarkModeStatus(message: string, isError: boolean): void {
  const el = document.getElementById('darkmode-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

function getDarkModeRadios(): HTMLInputElement[] {
  const nodes = document.querySelectorAll<HTMLInputElement>('input[name="darkmode"]');
  return Array.from(nodes);
}

function applyDarkModeRadioState(value: DarkModeValue): void {
  for (const input of getDarkModeRadios()) {
    input.checked = input.value === value;
  }
}

function applyDarkModeFromSettings(value: DarkModeValue): void {
  currentDarkMode = value;
  applyDarkModeRadioState(value);
  applyTheme(value);
  void renderReport();
}

async function handleDarkModeChange(value: string): Promise<void> {
  if (!isDarkModeValue(value)) return;
  if (value === currentDarkMode) return;
  const previous = currentDarkMode;
  currentDarkMode = value;
  applyTheme(value);
  void renderReport();
  try {
    await saveDarkMode(value);
    setDarkModeStatus(t('darkmode_saved_notice'), false);
  } catch (err) {
    logger.error('dark mode save failed', err);
    currentDarkMode = previous;
    applyDarkModeRadioState(previous);
    applyTheme(previous);
    void renderReport();
    setDarkModeStatus(t('darkmode_save_error_notice'), true);
  }
}

function bindDarkModeRadios(): void {
  for (const input of getDarkModeRadios()) {
    input.addEventListener('change', () => {
      if (input.checked) {
        void handleDarkModeChange(input.value);
      }
    });
  }
}

function bindDarkModeSystemListener(): void {
  installSystemThemeListener(() => {
    if (currentDarkMode === 'auto') {
      applyTheme('auto');
      void renderReport();
    }
  });
}

function bindDarkModeStorageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const settingsChange = changes['settings'];
    if (!settingsChange) return;
    const next = (settingsChange.newValue ?? null) as { darkMode?: unknown } | null;
    if (next && isDarkModeValue(next.darkMode) && next.darkMode !== currentDarkMode) {
      applyDarkModeFromSettings(next.darkMode);
    }
  });
}

const GROUPING_ERROR_KEY: Record<GroupingError, MessageKey> = {
  unavailable: 'grouping_unavailable_notice',
  no_candidates: 'grouping_no_candidates_notice',
};

function setGroupingStatus(message: string, isError: boolean): void {
  const el = document.getElementById('grouping-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

async function handleGroupingRun(): Promise<void> {
  const btn = document.getElementById('grouping-run-button');
  if (btn instanceof HTMLButtonElement) btn.disabled = true;
  setGroupingStatus('', false);
  try {
    const outcome = await groupTabsByDomain();
    if (outcome.ok) {
      setGroupingStatus(
        t('grouping_success_notice', [
          String(outcome.result.groupsCreated),
          String(outcome.result.tabsGrouped),
        ]),
        false,
      );
    } else {
      setGroupingStatus(t(GROUPING_ERROR_KEY[outcome.reason]), true);
    }
  } catch (err) {
    logger.error('groupTabsByDomain failed', err);
    setGroupingStatus(t('grouping_error_notice'), true);
  } finally {
    if (btn instanceof HTMLButtonElement) btn.disabled = false;
  }
}

function bindGroupingButton(): void {
  const btn = document.getElementById('grouping-run-button');
  if (!(btn instanceof HTMLButtonElement)) return;
  btn.addEventListener('click', () => {
    void handleGroupingRun();
  });
}

let currentFontScale: number = DEFAULT_SETTINGS.fontScale;
let fontScaleSaveTimer: number | null = null;

function clampFontScale(value: number): number {
  if (value < MIN_FONT_SCALE) return MIN_FONT_SCALE;
  if (value > MAX_FONT_SCALE) return MAX_FONT_SCALE;
  return Math.round(value * 100) / 100;
}

function setFontScaleStatus(message: string, isError: boolean): void {
  const el = document.getElementById('fontscale-status');
  if (!(el instanceof HTMLElement)) return;
  el.textContent = message;
  el.classList.toggle('is-error', isError);
}

function setFontScaleValueLabel(value: number): void {
  const el = document.getElementById('fontscale-value');
  if (!(el instanceof HTMLElement)) return;
  const percent = Math.round(value * 100);
  el.textContent = t('fontscale_value_format', [String(percent)]);
}

function getFontScaleSlider(): HTMLInputElement | null {
  const el = document.getElementById('fontscale-slider');
  return el instanceof HTMLInputElement ? el : null;
}

function applyFontScaleFromSettings(value: number): void {
  const clamped = clampFontScale(Number.isFinite(value) ? value : DEFAULT_SETTINGS.fontScale);
  currentFontScale = clamped;
  applyFontScale(clamped);
  const slider = getFontScaleSlider();
  if (slider) slider.value = String(clamped);
  setFontScaleValueLabel(clamped);
}

function scheduleFontScaleSave(value: number): void {
  if (fontScaleSaveTimer !== null) {
    window.clearTimeout(fontScaleSaveTimer);
  }
  fontScaleSaveTimer = window.setTimeout(() => {
    fontScaleSaveTimer = null;
    void persistFontScale(value);
  }, 250);
}

async function persistFontScale(value: number): Promise<void> {
  const result = validateFontScale(value);
  if (!result.ok) {
    setFontScaleStatus(t('fontscale_save_error_notice'), true);
    return;
  }
  try {
    await saveFontScale(result.value);
    setFontScaleStatus(t('fontscale_saved_notice'), false);
  } catch (err) {
    logger.error('font scale save failed', err);
    setFontScaleStatus(t('fontscale_save_error_notice'), true);
  }
}

function handleFontScaleInput(): void {
  const slider = getFontScaleSlider();
  if (!slider) return;
  const raw = Number(slider.value);
  if (!Number.isFinite(raw)) return;
  const value = clampFontScale(raw);
  currentFontScale = value;
  applyFontScale(value);
  setFontScaleValueLabel(value);
  scheduleFontScaleSave(value);
}

async function handleFontScaleReset(): Promise<void> {
  const btn = document.getElementById('fontscale-reset-button');
  if (btn instanceof HTMLButtonElement) btn.disabled = true;
  if (fontScaleSaveTimer !== null) {
    window.clearTimeout(fontScaleSaveTimer);
    fontScaleSaveTimer = null;
  }
  try {
    const next = await resetFontScale();
    applyFontScaleFromSettings(next.fontScale);
    setFontScaleStatus(t('fontscale_saved_notice'), false);
  } catch (err) {
    logger.error('font scale reset failed', err);
    setFontScaleStatus(t('fontscale_save_error_notice'), true);
  } finally {
    if (btn instanceof HTMLButtonElement) btn.disabled = false;
  }
}

function bindFontScaleControls(): void {
  const slider = getFontScaleSlider();
  if (slider) {
    slider.addEventListener('input', () => handleFontScaleInput());
  }
  const resetBtn = document.getElementById('fontscale-reset-button');
  if (resetBtn instanceof HTMLButtonElement) {
    resetBtn.addEventListener('click', () => {
      void handleFontScaleReset();
    });
  }
}

function bindFontScaleStorageListener(): void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return;
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    const settingsChange = changes['settings'];
    if (!settingsChange) return;
    const next = (settingsChange.newValue ?? null) as { fontScale?: unknown } | null;
    if (!next) return;
    const raw = Number(next.fontScale);
    if (!Number.isFinite(raw)) return;
    const clamped = clampFontScale(raw);
    if (Math.abs(clamped - currentFontScale) < 0.001) return;
    applyFontScaleFromSettings(clamped);
  });
}

function init(): void {
  applyTheme(currentDarkMode);
  applyFontScaleFromSettings(currentFontScale);
  applyI18nToDom(document);
  setFontScaleValueLabel(currentFontScale);
  bindForm();
  bindThresholdForm();
  bindInactiveForm();
  bindArchiveStorageListener();
  bindArchiveExportButton();
  bindArchiveImportButton();
  bindReportStorageListener();
  bindReportColorSchemeListener();
  bindGroupingButton();
  bindDarkModeRadios();
  bindDarkModeSystemListener();
  bindDarkModeStorageListener();
  bindFontScaleControls();
  bindFontScaleStorageListener();
  void loadAndRender();
  void loadAndRenderThresholds();
  void loadAndRenderArchive();
  void renderReport();
  logger.info('options loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
