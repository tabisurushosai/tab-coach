import { afterEach, describe, expect, it } from 'vitest';
import {
  ARCHIVE_EXPORT_VERSION,
  MAX_ARCHIVE_ENTRIES,
  addArchivedTabs,
  buildArchiveExportFilename,
  buildArchiveExportPayload,
  clearArchive,
  importArchivedTabs,
  loadArchive,
  parseArchiveImport,
  removeArchivedTab,
  saveArchive,
  serializeArchiveExport,
  toArchivedTab,
} from '@/lib/archive';
import { get, set } from '@/lib/storage';
import type { ArchivedTab, TabSnapshot } from '@/types/storage';

const snapshot = (overrides: Partial<TabSnapshot> = {}): TabSnapshot => ({
  id: 1,
  url: 'https://example.com/a',
  title: 'Example A',
  lastAccessed: 1000,
  ...overrides,
});

const archived = (overrides: Partial<ArchivedTab> = {}): ArchivedTab => ({
  id: 1,
  url: 'https://example.com/a',
  title: 'Example A',
  lastAccessed: 1000,
  archivedAt: 2000,
  ...overrides,
});

describe('archive', () => {
  afterEach(async () => {
    await chrome.storage.local.clear();
  });

  describe('toArchivedTab', () => {
    it('copies required fields and stamps archivedAt', () => {
      const result = toArchivedTab(snapshot(), 5000);
      expect(result).toEqual({
        id: 1,
        url: 'https://example.com/a',
        title: 'Example A',
        lastAccessed: 1000,
        archivedAt: 5000,
      });
    });

    it('preserves optional fields when present', () => {
      const result = toArchivedTab(
        snapshot({ favIconUrl: 'https://example.com/f.ico', windowId: 7, pinned: true }),
        3000,
      );
      expect(result).toEqual({
        id: 1,
        url: 'https://example.com/a',
        title: 'Example A',
        lastAccessed: 1000,
        archivedAt: 3000,
        favIconUrl: 'https://example.com/f.ico',
        windowId: 7,
        pinned: true,
      });
    });

    it('omits optional fields when undefined', () => {
      const result = toArchivedTab(snapshot(), 4000);
      expect('favIconUrl' in result).toBe(false);
      expect('windowId' in result).toBe(false);
      expect('pinned' in result).toBe(false);
    });

    it('uses Date.now() as the default archivedAt', () => {
      const before = Date.now();
      const result = toArchivedTab(snapshot());
      const after = Date.now();
      expect(result.archivedAt).toBeGreaterThanOrEqual(before);
      expect(result.archivedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('buildArchiveExportPayload', () => {
    it('wraps entries with the current version and timestamp', () => {
      const entries: ArchivedTab[] = [archived()];
      const payload = buildArchiveExportPayload(entries, 9999);
      expect(payload).toEqual({
        version: ARCHIVE_EXPORT_VERSION,
        exportedAt: 9999,
        entries,
      });
    });

    it('clones the entries array (does not share reference)', () => {
      const entries: ArchivedTab[] = [archived()];
      const payload = buildArchiveExportPayload(entries, 1);
      expect(payload.entries).not.toBe(entries);
      expect(payload.entries).toEqual(entries);
    });
  });

  describe('serializeArchiveExport', () => {
    it('produces pretty-printed JSON that round-trips through JSON.parse', () => {
      const entries: ArchivedTab[] = [archived()];
      const json = serializeArchiveExport(entries, 1234);
      expect(json).toContain('\n');
      const parsed = JSON.parse(json);
      expect(parsed).toEqual({
        version: ARCHIVE_EXPORT_VERSION,
        exportedAt: 1234,
        entries,
      });
    });
  });

  describe('buildArchiveExportFilename', () => {
    it('formats year-month-day-hour-minute-second from the timestamp', () => {
      const ts = new Date(2026, 0, 9, 3, 4, 5).getTime();
      expect(buildArchiveExportFilename(ts)).toBe('tab-coach-archive-20260109-030405.json');
    });

    it('falls back to a generic name for invalid timestamps', () => {
      expect(buildArchiveExportFilename(Number.NaN)).toBe('tab-coach-archive.json');
    });
  });

  describe('loadArchive / saveArchive', () => {
    it('returns an empty array when nothing has been stored', async () => {
      expect(await loadArchive()).toEqual([]);
    });

    it('persists entries and reads them back through storage', async () => {
      const entries: ArchivedTab[] = [archived()];
      await saveArchive(entries);
      expect(await loadArchive()).toEqual(entries);
      expect(await get('archive')).toEqual(entries);
    });

    it('clones the input before writing (caller mutations do not leak)', async () => {
      const entries: ArchivedTab[] = [archived()];
      await saveArchive(entries);
      entries.push(archived({ url: 'https://example.com/b', archivedAt: 3000 }));
      expect(await loadArchive()).toHaveLength(1);
    });
  });

  describe('addArchivedTabs', () => {
    it('prepends new entries so the newest is first', async () => {
      await saveArchive([archived({ url: 'https://old.com', archivedAt: 1 })]);
      const result = await addArchivedTabs([snapshot({ url: 'https://new.com' })], 5000);
      expect(result.added).toHaveLength(1);
      expect(result.trimmed).toBe(0);
      expect(result.entries[0]?.url).toBe('https://new.com');
      expect(result.entries[1]?.url).toBe('https://old.com');
    });

    it('skips snapshots with an empty or missing url', async () => {
      const result = await addArchivedTabs(
        [
          snapshot({ url: '' }),
          snapshot({ url: 'https://ok.com' }),
          { ...snapshot(), url: undefined as unknown as string },
        ],
        100,
      );
      expect(result.added).toHaveLength(1);
      expect(result.added[0]?.url).toBe('https://ok.com');
    });

    it('returns existing entries and added=0 when nothing valid was passed', async () => {
      await saveArchive([archived()]);
      const result = await addArchivedTabs([snapshot({ url: '' })]);
      expect(result.added).toEqual([]);
      expect(result.trimmed).toBe(0);
      expect(result.entries).toEqual([archived()]);
    });

    it('trims oldest entries beyond MAX_ARCHIVE_ENTRIES', async () => {
      const existing: ArchivedTab[] = Array.from({ length: MAX_ARCHIVE_ENTRIES }, (_, i) =>
        archived({ url: `https://old.com/${i}`, archivedAt: i + 1 }),
      );
      await saveArchive(existing);
      const result = await addArchivedTabs(
        [snapshot({ url: 'https://fresh.com' })],
        MAX_ARCHIVE_ENTRIES + 10,
      );
      expect(result.trimmed).toBe(1);
      expect(result.entries).toHaveLength(MAX_ARCHIVE_ENTRIES);
      expect(result.entries[0]?.url).toBe('https://fresh.com');
    });

    it('uses the provided now as archivedAt for added entries', async () => {
      const result = await addArchivedTabs([snapshot()], 7777);
      expect(result.added[0]?.archivedAt).toBe(7777);
    });
  });

  describe('removeArchivedTab', () => {
    it('removes the entry matching url + archivedAt', async () => {
      const a = archived({ url: 'https://a.com', archivedAt: 100 });
      const b = archived({ url: 'https://b.com', archivedAt: 200 });
      await saveArchive([a, b]);
      const next = await removeArchivedTab(100, 'https://a.com');
      expect(next).toEqual([b]);
      expect(await loadArchive()).toEqual([b]);
    });

    it('does not touch storage when no entry matches', async () => {
      const a = archived({ url: 'https://a.com', archivedAt: 100 });
      await saveArchive([a]);
      const next = await removeArchivedTab(999, 'https://a.com');
      expect(next).toEqual([a]);
      expect(await loadArchive()).toEqual([a]);
    });
  });

  describe('clearArchive', () => {
    it('writes an empty archive', async () => {
      await saveArchive([archived()]);
      await clearArchive();
      expect(await loadArchive()).toEqual([]);
    });
  });

  describe('parseArchiveImport', () => {
    it('parses a valid export payload', () => {
      const json = JSON.stringify({
        version: ARCHIVE_EXPORT_VERSION,
        exportedAt: 1,
        entries: [archived()],
      });
      const result = parseArchiveImport(json);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.entries).toEqual([archived()]);
        expect(result.payload.exportedAt).toBe(1);
      }
    });

    it('uses Date.now() when exportedAt is missing', () => {
      const before = Date.now();
      const json = JSON.stringify({
        version: ARCHIVE_EXPORT_VERSION,
        entries: [archived()],
      });
      const result = parseArchiveImport(json);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.exportedAt).toBeGreaterThanOrEqual(before);
      }
    });

    it('rejects invalid JSON', () => {
      const result = parseArchiveImport('not json');
      expect(result).toEqual({ ok: false, reason: 'invalid_json' });
    });

    it('rejects non-object roots', () => {
      const result = parseArchiveImport('[]');
      expect(result).toEqual({ ok: false, reason: 'invalid_shape' });
    });

    it('rejects null root', () => {
      const result = parseArchiveImport('null');
      expect(result).toEqual({ ok: false, reason: 'invalid_shape' });
    });

    it('rejects when version is missing', () => {
      const result = parseArchiveImport(JSON.stringify({ entries: [archived()] }));
      expect(result).toEqual({ ok: false, reason: 'invalid_shape' });
    });

    it('rejects an unsupported version', () => {
      const result = parseArchiveImport(
        JSON.stringify({ version: ARCHIVE_EXPORT_VERSION + 1, entries: [archived()] }),
      );
      expect(result).toEqual({ ok: false, reason: 'unsupported_version' });
    });

    it('rejects when entries is not an array', () => {
      const result = parseArchiveImport(
        JSON.stringify({ version: ARCHIVE_EXPORT_VERSION, entries: 'oops' }),
      );
      expect(result).toEqual({ ok: false, reason: 'invalid_shape' });
    });

    it('rejects when every entry is malformed (no_entries)', () => {
      const result = parseArchiveImport(
        JSON.stringify({
          version: ARCHIVE_EXPORT_VERSION,
          entries: [{ url: '' }, { foo: 'bar' }, null],
        }),
      );
      expect(result).toEqual({ ok: false, reason: 'no_entries' });
    });

    it('drops malformed entries but keeps valid ones', () => {
      const valid = archived({ url: 'https://keep.me', archivedAt: 5 });
      const result = parseArchiveImport(
        JSON.stringify({
          version: ARCHIVE_EXPORT_VERSION,
          entries: [
            valid,
            { url: 'https://bad.com' },
            { url: '', title: 'x', lastAccessed: 1, archivedAt: 1 },
            { url: 'https://nan.com', title: 't', lastAccessed: 'oops', archivedAt: 1 },
            { url: 'https://zero.com', title: 't', lastAccessed: 1, archivedAt: 0 },
          ],
        }),
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.entries).toEqual([valid]);
      }
    });

    it('preserves optional fields and defaults id to 0 when absent', () => {
      const result = parseArchiveImport(
        JSON.stringify({
          version: ARCHIVE_EXPORT_VERSION,
          entries: [
            {
              url: 'https://full.com',
              title: 'Full',
              lastAccessed: 10,
              archivedAt: 20,
              favIconUrl: 'https://full.com/f.ico',
              windowId: 3,
              pinned: false,
            },
          ],
        }),
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.entries[0]).toEqual({
          id: 0,
          url: 'https://full.com',
          title: 'Full',
          lastAccessed: 10,
          archivedAt: 20,
          favIconUrl: 'https://full.com/f.ico',
          windowId: 3,
          pinned: false,
        });
      }
    });

    it('drops a favIconUrl that is the empty string', () => {
      const result = parseArchiveImport(
        JSON.stringify({
          version: ARCHIVE_EXPORT_VERSION,
          entries: [
            {
              url: 'https://no-icon.com',
              title: 'NoIcon',
              lastAccessed: 1,
              archivedAt: 1,
              favIconUrl: '',
            },
          ],
        }),
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect('favIconUrl' in result.payload.entries[0]!).toBe(false);
      }
    });
  });

  describe('importArchivedTabs', () => {
    it('appends new entries and sorts by archivedAt descending', async () => {
      await saveArchive([archived({ url: 'https://old.com', archivedAt: 100 })]);
      const result = await importArchivedTabs([
        archived({ url: 'https://newer.com', archivedAt: 500 }),
        archived({ url: 'https://newest.com', archivedAt: 999 }),
      ]);
      expect(result.added).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.trimmed).toBe(0);
      expect(result.entries.map((e) => e.archivedAt)).toEqual([999, 500, 100]);
    });

    it('skips duplicates (same archivedAt + url) and reports skipped count', async () => {
      const existing = archived({ url: 'https://dup.com', archivedAt: 100 });
      await saveArchive([existing]);
      const result = await importArchivedTabs([
        existing,
        archived({ url: 'https://new.com', archivedAt: 200 }),
      ]);
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.entries).toHaveLength(2);
    });

    it('returns added=0 when every imported entry is a duplicate', async () => {
      const existing = archived({ url: 'https://dup.com', archivedAt: 100 });
      await saveArchive([existing]);
      const result = await importArchivedTabs([existing]);
      expect(result).toEqual({ added: 0, skipped: 1, trimmed: 0, entries: [existing] });
    });

    it('treats duplicates within the import payload itself as skipped', async () => {
      const dup = archived({ url: 'https://x.com', archivedAt: 1 });
      const result = await importArchivedTabs([dup, { ...dup }]);
      expect(result.added).toBe(1);
      expect(result.skipped).toBe(1);
    });

    it('trims to MAX_ARCHIVE_ENTRIES, keeping the newest archivedAt', async () => {
      const existing: ArchivedTab[] = Array.from({ length: MAX_ARCHIVE_ENTRIES }, (_, i) =>
        archived({ url: `https://old.com/${i}`, archivedAt: i + 1 }),
      );
      await saveArchive(existing);
      const result = await importArchivedTabs([
        archived({ url: 'https://fresh.com', archivedAt: MAX_ARCHIVE_ENTRIES + 10 }),
      ]);
      expect(result.trimmed).toBe(1);
      expect(result.entries).toHaveLength(MAX_ARCHIVE_ENTRIES);
      expect(result.entries[0]?.url).toBe('https://fresh.com');
    });
  });

  describe('round-trip (export → import)', () => {
    it('serialize → parseArchiveImport preserves entries', async () => {
      const entries: ArchivedTab[] = [
        archived({ url: 'https://a.com', archivedAt: 100 }),
        archived({
          url: 'https://b.com',
          archivedAt: 200,
          favIconUrl: 'https://b.com/icon.ico',
          windowId: 2,
          pinned: true,
        }),
      ];
      const json = serializeArchiveExport(entries, 9999);
      const parsed = parseArchiveImport(json);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        await set('archive', []);
        const importResult = await importArchivedTabs(parsed.payload.entries);
        expect(importResult.added).toBe(entries.length);
        expect(importResult.entries.map((e) => e.url).sort()).toEqual(
          entries.map((e) => e.url).sort(),
        );
      }
    });
  });
});
