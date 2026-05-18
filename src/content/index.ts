import { logger } from '@/lib/logger';
import type { ReadingProgressMessage } from '@/types/messages';

logger.debug('content script loaded', location.href);

const REPORT_INTERVAL_MS = 15_000;

const loadedAt = Date.now();
let visibleSinceMs: number = document.visibilityState === 'visible' ? loadedAt : 0;
let accumulatedVisibleMs = 0;
let maxScrollPercent = 0;
let lastReportedScrollPercent = -1;
let lastReportedDwellMs = -1;
let reportTimerId: ReturnType<typeof setInterval> | null = null;

function getScrollPercent(): number {
  const el = document.scrollingElement ?? document.documentElement;
  const scrollTop = el.scrollTop;
  const viewport = el.clientHeight;
  const scrollHeight = el.scrollHeight;
  const scrollable = scrollHeight - viewport;
  if (scrollable <= 0) return 100;
  const percent = ((scrollTop + viewport) / scrollHeight) * 100;
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, percent));
}

function updateScroll(): void {
  const p = getScrollPercent();
  if (p > maxScrollPercent) maxScrollPercent = p;
}

function currentDwellMs(): number {
  const active = visibleSinceMs > 0 ? Date.now() - visibleSinceMs : 0;
  return accumulatedVisibleMs + active;
}

function buildMessage(): ReadingProgressMessage {
  return {
    type: 'READING_PROGRESS',
    url: location.href,
    maxScrollPercent: Math.round(maxScrollPercent),
    dwellMs: currentDwellMs(),
    reportedAt: Date.now(),
  };
}

function sendProgress(force = false): void {
  const message = buildMessage();
  if (
    !force &&
    message.maxScrollPercent === lastReportedScrollPercent &&
    message.dwellMs === lastReportedDwellMs
  ) {
    return;
  }
  lastReportedScrollPercent = message.maxScrollPercent;
  lastReportedDwellMs = message.dwellMs;
  try {
    const result: unknown = chrome.runtime.sendMessage(message);
    if (result !== null && typeof result === 'object' && result instanceof Promise) {
      result.catch((err: unknown) => logger.debug('sendMessage failed', err));
    }
  } catch (err) {
    logger.debug('sendMessage threw', err);
  }
}

function startReportTimer(): void {
  if (reportTimerId !== null) return;
  reportTimerId = setInterval(() => sendProgress(false), REPORT_INTERVAL_MS);
}

function stopReportTimer(): void {
  if (reportTimerId === null) return;
  clearInterval(reportTimerId);
  reportTimerId = null;
}

function handleVisibility(): void {
  const now = Date.now();
  if (document.visibilityState === 'visible') {
    if (visibleSinceMs === 0) visibleSinceMs = now;
    startReportTimer();
  } else {
    if (visibleSinceMs > 0) {
      accumulatedVisibleMs += now - visibleSinceMs;
      visibleSinceMs = 0;
    }
    stopReportTimer();
    sendProgress(true);
  }
}

function handlePageHide(): void {
  if (visibleSinceMs > 0) {
    accumulatedVisibleMs += Date.now() - visibleSinceMs;
    visibleSinceMs = 0;
  }
  stopReportTimer();
  sendProgress(true);
}

updateScroll();
window.addEventListener('scroll', updateScroll, { passive: true });
document.addEventListener('visibilitychange', handleVisibility);
window.addEventListener('pagehide', handlePageHide);
if (document.visibilityState === 'visible') startReportTimer();

export const __readingProgress = {
  getMaxScrollPercent: (): number => maxScrollPercent,
  getDwellMs: currentDwellMs,
  getLoadedAt: (): number => loadedAt,
  sendNow: (): void => sendProgress(true),
};
