import { describe, expect, it } from 'vitest';
import { MAX_CLEANUP_HISTORY, loadCleanupHistory, recordCleanup } from '@/lib/report';
import { MAX_ARCHIVE_ENTRIES, addArchivedTabs, loadArchive } from '@/lib/archive';
import {
  UNDO_WINDOW_MS,
  clearIfExpired,
  createUndoSnapshot,
  loadUndoSnapshot,
  saveUndoSnapshot,
} from '@/lib/snapshot';
import { markReadCompleted } from '@/lib/reading';
import { get } from '@/lib/storage';
import type { TabSnapshot } from '@/types/storage';

const snapshot = (id: number, url: string): TabSnapshot => ({
  id,
  url,
  title: `Tab ${id}`,
  lastAccessed: 0,
});

describe('memory leak monitoring (service worker grow-up)', () => {
  describe('cleanupHistory', () => {
    it('stays bounded at MAX_CLEANUP_HISTORY across many recordCleanup calls', async () => {
      const overflow = MAX_CLEANUP_HISTORY + 50;
      for (let i = 0; i < overflow; i += 1) {
        await recordCleanup(1, 'manual', i + 1);
      }
      const history = await loadCleanupHistory();
      expect(history.length).toBe(MAX_CLEANUP_HISTORY);
      expect(history[0]!.at).toBe(overflow - MAX_CLEANUP_HISTORY + 1);
      expect(history.at(-1)!.at).toBe(overflow);
    });

    it('reports the trimmed count once the cap is exceeded', async () => {
      for (let i = 0; i < MAX_CLEANUP_HISTORY; i += 1) {
        const result = await recordCleanup(1, 'inactive', i + 1);
        expect(result?.trimmed).toBe(0);
      }
      const overflow = await recordCleanup(1, 'inactive', MAX_CLEANUP_HISTORY + 1);
      expect(overflow?.trimmed).toBe(1);
      expect(overflow?.history.length).toBe(MAX_CLEANUP_HISTORY);
    });
  });

  describe('archive', () => {
    it('stays bounded at MAX_ARCHIVE_ENTRIES across many addArchivedTabs calls', async () => {
      const batchSize = 25;
      const batches = Math.ceil((MAX_ARCHIVE_ENTRIES + 100) / batchSize);
      for (let b = 0; b < batches; b += 1) {
        const tabs: TabSnapshot[] = [];
        for (let i = 0; i < batchSize; i += 1) {
          const idx = b * batchSize + i;
          tabs.push(snapshot(idx, `https://example.com/${idx}`));
        }
        await addArchivedTabs(tabs, b * batchSize + 1);
      }
      const archive = await loadArchive();
      expect(archive.length).toBe(MAX_ARCHIVE_ENTRIES);
    });
  });

  describe('undoSnapshot', () => {
    it('replaces the existing snapshot rather than accumulating', async () => {
      for (let i = 0; i < 100; i += 1) {
        const snap = createUndoSnapshot([snapshot(i, `https://example.com/${i}`)], 30_000, i + 1);
        await saveUndoSnapshot(snap);
      }
      const stored = await get('undoSnapshot');
      expect(stored).not.toBeNull();
      expect(stored!.tabs).toHaveLength(1);
      expect(stored!.at).toBe(100);
    });

    it('is purged once expired so storage does not retain stale snapshots', async () => {
      const start = 1_000_000;
      const snap = createUndoSnapshot([snapshot(1, 'https://example.com/1')], 30_000, start);
      await saveUndoSnapshot(snap);

      await clearIfExpired(start + 10);
      expect(await get('undoSnapshot')).not.toBeNull();

      await clearIfExpired(start + UNDO_WINDOW_MS + 1);
      expect(await get('undoSnapshot')).toBeNull();
    });

    it('loadUndoSnapshot also clears expired snapshots on read', async () => {
      const start = 2_000_000;
      const snap = createUndoSnapshot([snapshot(1, 'https://example.com/1')], 30_000, start);
      await saveUndoSnapshot(snap);

      const loaded = await loadUndoSnapshot(start + UNDO_WINDOW_MS + 1);
      expect(loaded).toBeNull();
      expect(await get('undoSnapshot')).toBeNull();
    });
  });

  describe('readCompleted', () => {
    it('does not duplicate entries when the same URL is marked repeatedly', async () => {
      const url = 'https://example.com/article';
      for (let i = 0; i < 200; i += 1) {
        await markReadCompleted(url, i + 1);
      }
      const map = await get('readCompleted');
      const keys = Object.keys(map);
      expect(keys).toHaveLength(1);
      expect(map[keys[0]!]).toBe(200);
    });

    it('hash fragments collapse into the same entry so SPA scroll noise cannot inflate storage', async () => {
      await markReadCompleted('https://example.com/post#section-1', 1);
      await markReadCompleted('https://example.com/post#section-2', 2);
      await markReadCompleted('https://example.com/post', 3);
      const map = await get('readCompleted');
      expect(Object.keys(map)).toHaveLength(1);
    });
  });
});
