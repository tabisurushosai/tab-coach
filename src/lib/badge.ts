import { countAllTabs } from '@/lib/tabs';
import { get } from '@/lib/storage';
import type { Settings } from '@/types/storage';

export type BadgeLevel = 'gray' | 'yellow' | 'red';

export const BADGE_COLORS: Record<BadgeLevel, string> = {
  gray: '#9CA3AF',
  yellow: '#F59E0B',
  red: '#DC2626',
};

export function formatBadgeText(count: number): string {
  if (count <= 0) return '';
  if (count > 999) return '999+';
  return String(count);
}

export function resolveBadgeLevel(
  count: number,
  thresholds: Pick<Settings, 'tabLimitYellow' | 'tabLimitRed'>,
): BadgeLevel {
  const yellow = Math.max(1, Math.floor(thresholds.tabLimitYellow));
  const red = Math.max(yellow + 1, Math.floor(thresholds.tabLimitRed));
  if (count >= red) return 'red';
  if (count >= yellow) return 'yellow';
  return 'gray';
}

export async function setBadgeCount(count: number, level: BadgeLevel): Promise<void> {
  await chrome.action.setBadgeText({ text: formatBadgeText(count) });
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLORS[level] });
}

export async function refreshBadge(): Promise<number> {
  const [count, settings] = await Promise.all([countAllTabs(), get('settings')]);
  const level = resolveBadgeLevel(count, settings);
  await setBadgeCount(count, level);
  return count;
}
