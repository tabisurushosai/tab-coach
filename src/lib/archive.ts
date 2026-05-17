import { get, set } from '@/lib/storage';
import type { ArchivedTab, TabSnapshot } from '@/types/storage';

export const MAX_ARCHIVE_ENTRIES = 500;

export function toArchivedTab(
  snapshot: TabSnapshot,
  archivedAt: number = Date.now(),
): ArchivedTab {
  const entry: ArchivedTab = {
    id: snapshot.id,
    url: snapshot.url,
    title: snapshot.title,
    lastAccessed: snapshot.lastAccessed,
    archivedAt,
  };
  if (snapshot.favIconUrl !== undefined) entry.favIconUrl = snapshot.favIconUrl;
  if (snapshot.windowId !== undefined) entry.windowId = snapshot.windowId;
  if (snapshot.pinned !== undefined) entry.pinned = snapshot.pinned;
  return entry;
}

export async function loadArchive(): Promise<ArchivedTab[]> {
  return get('archive');
}

export async function saveArchive(entries: readonly ArchivedTab[]): Promise<void> {
  await set('archive', [...entries]);
}

export type AddArchivedTabsResult = {
  added: ArchivedTab[];
  entries: ArchivedTab[];
  trimmed: number;
};

export async function addArchivedTabs(
  snapshots: readonly TabSnapshot[],
  now: number = Date.now(),
): Promise<AddArchivedTabsResult> {
  const valid = snapshots.filter((s) => typeof s.url === 'string' && s.url.length > 0);
  if (valid.length === 0) {
    const entries = await loadArchive();
    return { added: [], entries, trimmed: 0 };
  }
  const added = valid.map((s) => toArchivedTab(s, now));
  const current = await loadArchive();
  const merged = [...added, ...current];
  const trimmed = Math.max(0, merged.length - MAX_ARCHIVE_ENTRIES);
  const next = trimmed === 0 ? merged : merged.slice(0, MAX_ARCHIVE_ENTRIES);
  await saveArchive(next);
  return { added, entries: next, trimmed };
}

export async function removeArchivedTab(archivedAt: number, url: string): Promise<ArchivedTab[]> {
  const current = await loadArchive();
  const next = current.filter((e) => !(e.archivedAt === archivedAt && e.url === url));
  if (next.length === current.length) return current;
  await saveArchive(next);
  return next;
}

export async function clearArchive(): Promise<void> {
  await saveArchive([]);
}
