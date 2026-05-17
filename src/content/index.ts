import { logger } from '@/lib/logger';

logger.debug('content script loaded', location.href);

const loadedAt = Date.now();
let visibleSinceMs: number = document.visibilityState === 'visible' ? loadedAt : 0;
let accumulatedVisibleMs = 0;
let maxScrollPercent = 0;

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

function handleVisibility(): void {
  const now = Date.now();
  if (document.visibilityState === 'visible') {
    if (visibleSinceMs === 0) visibleSinceMs = now;
  } else {
    if (visibleSinceMs > 0) {
      accumulatedVisibleMs += now - visibleSinceMs;
      visibleSinceMs = 0;
    }
  }
}

updateScroll();
window.addEventListener('scroll', updateScroll, { passive: true });
document.addEventListener('visibilitychange', handleVisibility);
window.addEventListener('pagehide', handleVisibility);

export const __readingProgress = {
  getMaxScrollPercent: (): number => maxScrollPercent,
  getDwellMs: currentDwellMs,
  getLoadedAt: (): number => loadedAt,
};
