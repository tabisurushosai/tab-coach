import { get, set } from '@/lib/storage';
import type { TabSnapshot, UndoSnapshot } from '@/types/storage';

export const UNDO_WINDOW_MS = 30_000;

export function createUndoSnapshot(
  tabs: readonly TabSnapshot[],
  windowMs: number = UNDO_WINDOW_MS,
  now: number = Date.now(),
): UndoSnapshot {
  const safeWindow =
    Number.isFinite(windowMs) && windowMs > 0 ? Math.floor(windowMs) : UNDO_WINDOW_MS;
  return {
    at: now,
    tabs: tabs.map((t) => ({ ...t })),
    expiresAt: now + safeWindow,
  };
}

export function isUndoSnapshotExpired(snapshot: UndoSnapshot, now: number = Date.now()): boolean {
  return snapshot.expiresAt <= now;
}

export async function saveUndoSnapshot(snapshot: UndoSnapshot): Promise<void> {
  await set('undoSnapshot', snapshot);
}

export async function clearUndoSnapshot(): Promise<void> {
  await set('undoSnapshot', null);
}

export async function loadUndoSnapshot(now: number = Date.now()): Promise<UndoSnapshot | null> {
  const snapshot = await get('undoSnapshot');
  if (snapshot === null) return null;
  if (isUndoSnapshotExpired(snapshot, now)) {
    await clearUndoSnapshot();
    return null;
  }
  return snapshot;
}

export async function clearIfExpired(now: number = Date.now()): Promise<void> {
  const snapshot = await get('undoSnapshot');
  if (snapshot !== null && isUndoSnapshotExpired(snapshot, now)) {
    await clearUndoSnapshot();
  }
}
