import { afterEach, describe, expect, it } from 'vitest';
import {
  UNDO_WINDOW_MS,
  clearIfExpired,
  clearUndoSnapshot,
  createUndoSnapshot,
  isUndoSnapshotExpired,
  loadUndoSnapshot,
  saveUndoSnapshot,
} from '@/lib/snapshot';
import { get, set } from '@/lib/storage';
import type { TabSnapshot, UndoSnapshot } from '@/types/storage';

const snapshot = (overrides: Partial<TabSnapshot> = {}): TabSnapshot => ({
  id: 1,
  url: 'https://example.com/a',
  title: 'Example A',
  lastAccessed: 1000,
  ...overrides,
});

const undo = (overrides: Partial<UndoSnapshot> = {}): UndoSnapshot => ({
  at: 1000,
  tabs: [snapshot()],
  expiresAt: 1000 + UNDO_WINDOW_MS,
  ...overrides,
});

describe('snapshot', () => {
  afterEach(async () => {
    await chrome.storage.local.clear();
  });

  describe('UNDO_WINDOW_MS', () => {
    it('is 30 seconds in milliseconds', () => {
      expect(UNDO_WINDOW_MS).toBe(30_000);
    });
  });

  describe('createUndoSnapshot', () => {
    it('captures tabs with default window and provided now', () => {
      const tabs: TabSnapshot[] = [snapshot()];
      const result = createUndoSnapshot(tabs, undefined, 5000);
      expect(result).toEqual({
        at: 5000,
        tabs: [snapshot()],
        expiresAt: 5000 + UNDO_WINDOW_MS,
      });
    });

    it('uses a custom windowMs when supplied', () => {
      const result = createUndoSnapshot([snapshot()], 60_000, 1000);
      expect(result.expiresAt).toBe(1000 + 60_000);
    });

    it('clones each tab so caller mutations do not leak into the snapshot', () => {
      const original = snapshot({ title: 'before' });
      const result = createUndoSnapshot([original], UNDO_WINDOW_MS, 0);
      original.title = 'after';
      expect(result.tabs[0]?.title).toBe('before');
      expect(result.tabs[0]).not.toBe(original);
    });

    it('returns an empty tabs array when given no tabs', () => {
      const result = createUndoSnapshot([], UNDO_WINDOW_MS, 100);
      expect(result.tabs).toEqual([]);
      expect(result.at).toBe(100);
      expect(result.expiresAt).toBe(100 + UNDO_WINDOW_MS);
    });

    it('falls back to UNDO_WINDOW_MS when windowMs is zero', () => {
      const result = createUndoSnapshot([snapshot()], 0, 1000);
      expect(result.expiresAt).toBe(1000 + UNDO_WINDOW_MS);
    });

    it('falls back to UNDO_WINDOW_MS when windowMs is negative', () => {
      const result = createUndoSnapshot([snapshot()], -500, 1000);
      expect(result.expiresAt).toBe(1000 + UNDO_WINDOW_MS);
    });

    it('falls back to UNDO_WINDOW_MS when windowMs is NaN', () => {
      const result = createUndoSnapshot([snapshot()], Number.NaN, 1000);
      expect(result.expiresAt).toBe(1000 + UNDO_WINDOW_MS);
    });

    it('falls back to UNDO_WINDOW_MS when windowMs is Infinity', () => {
      const result = createUndoSnapshot([snapshot()], Number.POSITIVE_INFINITY, 1000);
      expect(result.expiresAt).toBe(1000 + UNDO_WINDOW_MS);
    });

    it('floors a fractional windowMs', () => {
      const result = createUndoSnapshot([snapshot()], 12_345.9, 1000);
      expect(result.expiresAt).toBe(1000 + 12_345);
    });

    it('uses Date.now() as the default now', () => {
      const before = Date.now();
      const result = createUndoSnapshot([snapshot()]);
      const after = Date.now();
      expect(result.at).toBeGreaterThanOrEqual(before);
      expect(result.at).toBeLessThanOrEqual(after);
      expect(result.expiresAt).toBe(result.at + UNDO_WINDOW_MS);
    });

    it('preserves optional fields on cloned tabs', () => {
      const t = snapshot({ favIconUrl: 'https://e.com/f.ico', windowId: 7, pinned: true });
      const result = createUndoSnapshot([t], UNDO_WINDOW_MS, 0);
      expect(result.tabs[0]).toEqual(t);
    });
  });

  describe('isUndoSnapshotExpired', () => {
    it('returns false before expiresAt', () => {
      expect(isUndoSnapshotExpired(undo({ expiresAt: 5000 }), 4999)).toBe(false);
    });

    it('returns true at exactly expiresAt', () => {
      expect(isUndoSnapshotExpired(undo({ expiresAt: 5000 }), 5000)).toBe(true);
    });

    it('returns true after expiresAt', () => {
      expect(isUndoSnapshotExpired(undo({ expiresAt: 5000 }), 5001)).toBe(true);
    });

    it('uses Date.now() as the default now', () => {
      const future = undo({ expiresAt: Date.now() + 60_000 });
      const past = undo({ expiresAt: Date.now() - 1 });
      expect(isUndoSnapshotExpired(future)).toBe(false);
      expect(isUndoSnapshotExpired(past)).toBe(true);
    });
  });

  describe('saveUndoSnapshot / loadUndoSnapshot', () => {
    it('returns null when nothing has been stored', async () => {
      expect(await loadUndoSnapshot()).toBeNull();
    });

    it('persists a snapshot and reads it back through storage', async () => {
      const s = undo({ at: 1000, expiresAt: 1000 + UNDO_WINDOW_MS });
      await saveUndoSnapshot(s);
      expect(await get('undoSnapshot')).toEqual(s);
      expect(await loadUndoSnapshot(1000)).toEqual(s);
    });

    it('returns null and clears storage when the stored snapshot is expired', async () => {
      const s = undo({ at: 1000, expiresAt: 2000 });
      await saveUndoSnapshot(s);
      expect(await loadUndoSnapshot(3000)).toBeNull();
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('returns the snapshot when now is strictly before expiresAt', async () => {
      const s = undo({ expiresAt: 5000 });
      await saveUndoSnapshot(s);
      expect(await loadUndoSnapshot(4999)).toEqual(s);
    });

    it('treats now === expiresAt as expired', async () => {
      const s = undo({ expiresAt: 5000 });
      await saveUndoSnapshot(s);
      expect(await loadUndoSnapshot(5000)).toBeNull();
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('returns null when storage holds an explicit null', async () => {
      await set('undoSnapshot', null);
      expect(await loadUndoSnapshot()).toBeNull();
    });
  });

  describe('clearUndoSnapshot', () => {
    it('writes null to storage', async () => {
      await saveUndoSnapshot(undo());
      await clearUndoSnapshot();
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('is idempotent when called on empty storage', async () => {
      await clearUndoSnapshot();
      expect(await get('undoSnapshot')).toBeNull();
    });
  });

  describe('clearIfExpired', () => {
    it('clears an expired snapshot from storage', async () => {
      const s = undo({ at: 1000, expiresAt: 2000 });
      await saveUndoSnapshot(s);
      await clearIfExpired(3000);
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('leaves a fresh snapshot untouched', async () => {
      const s = undo({ at: 1000, expiresAt: 5000 });
      await saveUndoSnapshot(s);
      await clearIfExpired(1500);
      expect(await get('undoSnapshot')).toEqual(s);
    });

    it('is a no-op when storage is empty', async () => {
      await clearIfExpired(9999);
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('treats now === expiresAt as expired', async () => {
      const s = undo({ expiresAt: 4000 });
      await saveUndoSnapshot(s);
      await clearIfExpired(4000);
      expect(await get('undoSnapshot')).toBeNull();
    });
  });

  describe('round-trip (create → save → load)', () => {
    it('preserves tab contents across the storage boundary', async () => {
      const tabs: TabSnapshot[] = [
        snapshot({ url: 'https://a.com' }),
        snapshot({
          id: 2,
          url: 'https://b.com',
          title: 'B',
          favIconUrl: 'https://b.com/f.ico',
          windowId: 3,
          pinned: true,
        }),
      ];
      const created = createUndoSnapshot(tabs, UNDO_WINDOW_MS, 1000);
      await saveUndoSnapshot(created);
      const loaded = await loadUndoSnapshot(1500);
      expect(loaded).toEqual(created);
    });

    it('returns null after the window closes', async () => {
      const created = createUndoSnapshot([snapshot()], UNDO_WINDOW_MS, 1000);
      await saveUndoSnapshot(created);
      expect(await loadUndoSnapshot(1000 + UNDO_WINDOW_MS)).toBeNull();
    });
  });
});
