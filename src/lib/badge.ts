import { countAllTabs } from '@/lib/tabs';

export function formatBadgeText(count: number): string {
  if (count <= 0) return '';
  if (count > 999) return '999+';
  return String(count);
}

export async function setBadgeCount(count: number): Promise<void> {
  await chrome.action.setBadgeText({ text: formatBadgeText(count) });
}

export async function refreshBadge(): Promise<number> {
  const count = await countAllTabs();
  await setBadgeCount(count);
  return count;
}
