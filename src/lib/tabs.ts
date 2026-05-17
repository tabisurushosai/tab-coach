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

export const DEFAULT_INACTIVE_THRESHOLD_MINUTES = 30;

export function isInactive<T extends Pick<TabSnapshot, 'lastAccessed'>>(
  snapshot: T,
  thresholdMinutes: number = DEFAULT_INACTIVE_THRESHOLD_MINUTES,
  now: number = Date.now(),
): boolean {
  if (!Number.isFinite(thresholdMinutes) || thresholdMinutes < 0) return false;
  return inactiveMinutes(snapshot, now) >= thresholdMinutes;
}

export function filterInactive<T extends Pick<TabSnapshot, 'lastAccessed'>>(
  snapshots: readonly T[],
  thresholdMinutes: number = DEFAULT_INACTIVE_THRESHOLD_MINUTES,
  now: number = Date.now(),
): T[] {
  return snapshots.filter((s) => isInactive(s, thresholdMinutes, now));
}

export function getHostname(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return host ? host.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function groupByHostname<T extends Pick<TabSnapshot, 'url'>>(
  snapshots: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const snapshot of snapshots) {
    const host = getHostname(snapshot.url);
    if (!host) continue;
    const bucket = groups.get(host);
    if (bucket) bucket.push(snapshot);
    else groups.set(host, [snapshot]);
  }
  return groups;
}

export function filterDuplicateHostnames<T extends Pick<TabSnapshot, 'url'>>(
  snapshots: readonly T[],
): T[] {
  const result: T[] = [];
  for (const group of groupByHostname(snapshots).values()) {
    if (group.length >= 2) result.push(...group);
  }
  return result;
}
