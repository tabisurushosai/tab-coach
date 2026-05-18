import { update } from '@/lib/storage';

export const READ_SCROLL_PERCENT_THRESHOLD = 90;
export const READ_DWELL_MS_THRESHOLD = 60_000;

export function isReadCompleted(maxScrollPercent: number, dwellMs: number): boolean {
  return maxScrollPercent >= READ_SCROLL_PERCENT_THRESHOLD && dwellMs >= READ_DWELL_MS_THRESHOLD;
}

export function normalizeReadUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    u.hash = '';
    return u.toString();
  } catch {
    return null;
  }
}

export async function markReadCompleted(
  rawUrl: string,
  at: number = Date.now(),
): Promise<string | null> {
  const key = normalizeReadUrl(rawUrl);
  if (key === null) return null;
  await update('readCompleted', (current) => ({ ...current, [key]: at }));
  return key;
}
