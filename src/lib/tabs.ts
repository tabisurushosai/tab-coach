import type { TabSnapshot } from '@/types/storage';

export type QueryAllOptions = {
  windowId?: number;
  currentWindow?: boolean;
};

export async function queryAllTabs(options: QueryAllOptions = {}): Promise<chrome.tabs.Tab[]> {
  const queryInfo: chrome.tabs.QueryInfo = {};
  if (options.windowId !== undefined) queryInfo.windowId = options.windowId;
  if (options.currentWindow !== undefined) queryInfo.currentWindow = options.currentWindow;
  return chrome.tabs.query(queryInfo);
}

export function toSnapshot(tab: chrome.tabs.Tab, now: number = Date.now()): TabSnapshot {
  const tabWithAccess = tab as chrome.tabs.Tab & { lastAccessed?: number };
  const snapshot: TabSnapshot = {
    id: tab.id ?? -1,
    url: tab.url ?? tab.pendingUrl ?? '',
    title: tab.title ?? '',
    lastAccessed: typeof tabWithAccess.lastAccessed === 'number' ? tabWithAccess.lastAccessed : now,
  };
  if (tab.favIconUrl !== undefined) snapshot.favIconUrl = tab.favIconUrl;
  if (tab.windowId !== undefined) snapshot.windowId = tab.windowId;
  if (tab.pinned !== undefined) snapshot.pinned = tab.pinned;
  return snapshot;
}

export async function queryAllSnapshots(options: QueryAllOptions = {}): Promise<TabSnapshot[]> {
  const tabs = await queryAllTabs(options);
  const now = Date.now();
  return tabs.map((t) => toSnapshot(t, now));
}

export async function countAllTabs(options: QueryAllOptions = {}): Promise<number> {
  const tabs = await queryAllTabs(options);
  return tabs.length;
}

export function inactiveMs(snapshot: Pick<TabSnapshot, 'lastAccessed'>, now: number = Date.now()): number {
  const elapsed = now - snapshot.lastAccessed;
  return elapsed > 0 ? elapsed : 0;
}

export function inactiveMinutes(snapshot: Pick<TabSnapshot, 'lastAccessed'>, now: number = Date.now()): number {
  return Math.floor(inactiveMs(snapshot, now) / 60_000);
}
