import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_INACTIVE_THRESHOLD_MINUTES,
  countAllTabs,
  filterDuplicateHostnames,
  filterInactive,
  getHostname,
  groupByHostname,
  inactiveMinutes,
  inactiveMs,
  isInactive,
  pickDuplicateClosable,
  queryAllSnapshots,
  queryAllTabs,
  toSnapshot,
} from '@/lib/tabs';
import type { TabSnapshot } from '@/types/storage';

type TabWithAccess = chrome.tabs.Tab & { lastAccessed?: number | undefined };
type TabOverrides = { [K in keyof TabWithAccess]?: TabWithAccess[K] | undefined };

const makeTab = (overrides: TabOverrides = {}): TabWithAccess => {
  const base: TabWithAccess = {
    id: 1,
    index: 0,
    windowId: 10,
    highlighted: false,
    active: false,
    pinned: false,
    url: 'https://example.com/',
    title: 'Example',
    favIconUrl: 'https://example.com/favicon.ico',
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
  };
  return Object.assign(base, overrides);
};

const makeSnapshot = (overrides: Partial<TabSnapshot> = {}): TabSnapshot => ({
  id: 1,
  url: 'https://example.com/',
  title: 'Example',
  lastAccessed: 1_700_000_000_000,
  ...overrides,
});

describe('tabs library', () => {
  describe('queryAllTabs', () => {
    it('passes empty queryInfo when no options provided', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([makeTab()]);
      const tabs = await queryAllTabs();
      expect(queryMock).toHaveBeenCalledWith({});
      expect(tabs).toHaveLength(1);
    });

    it('passes windowId when provided', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([]);
      await queryAllTabs({ windowId: 42 });
      expect(queryMock).toHaveBeenCalledWith({ windowId: 42 });
    });

    it('passes currentWindow when provided', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([]);
      await queryAllTabs({ currentWindow: true });
      expect(queryMock).toHaveBeenCalledWith({ currentWindow: true });
    });

    it('passes both windowId and currentWindow', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([]);
      await queryAllTabs({ windowId: 7, currentWindow: false });
      expect(queryMock).toHaveBeenCalledWith({ windowId: 7, currentWindow: false });
    });
  });

  describe('toSnapshot', () => {
    it('converts a tab with all fields populated', () => {
      const tab = makeTab({
        id: 99,
        url: 'https://example.com/page',
        title: 'Title',
        favIconUrl: 'https://example.com/favicon.ico',
        windowId: 33,
        pinned: true,
        lastAccessed: 1_700_000_500_000,
      });
      const snapshot = toSnapshot(tab, 1_700_000_999_000);
      expect(snapshot).toEqual({
        id: 99,
        url: 'https://example.com/page',
        title: 'Title',
        favIconUrl: 'https://example.com/favicon.ico',
        windowId: 33,
        pinned: true,
        lastAccessed: 1_700_000_500_000,
      });
    });

    it('falls back to pendingUrl when url is empty', () => {
      const tab = makeTab({ url: undefined, pendingUrl: 'https://pending.example/' });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot.url).toBe('https://pending.example/');
    });

    it('falls back to empty string when neither url nor pendingUrl is present', () => {
      const tab = makeTab({ url: undefined, pendingUrl: undefined });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot.url).toBe('');
    });

    it('uses provided "now" when lastAccessed is missing', () => {
      const tab = makeTab({ lastAccessed: undefined });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot.lastAccessed).toBe(1_700_000_000_000);
    });

    it('uses Date.now() default when lastAccessed missing and no "now" passed', () => {
      const tab = makeTab({ lastAccessed: undefined });
      const before = Date.now();
      const snapshot = toSnapshot(tab);
      const after = Date.now();
      expect(snapshot.lastAccessed).toBeGreaterThanOrEqual(before);
      expect(snapshot.lastAccessed).toBeLessThanOrEqual(after);
    });

    it('coerces missing id to -1', () => {
      const tab = makeTab({ id: undefined });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot.id).toBe(-1);
    });

    it('coerces missing title to empty string', () => {
      const tab = makeTab({ title: undefined });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot.title).toBe('');
    });

    it('omits favIconUrl when undefined', () => {
      const tab = makeTab({ favIconUrl: undefined });
      const snapshot = toSnapshot(tab, 1_700_000_000_000);
      expect(snapshot).not.toHaveProperty('favIconUrl');
    });
  });

  describe('queryAllSnapshots', () => {
    it('returns snapshots from queried tabs', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([
        makeTab({ id: 1, url: 'https://a.example/', lastAccessed: 1_700_000_000_000 }),
        makeTab({ id: 2, url: 'https://b.example/', lastAccessed: 1_700_000_001_000 }),
      ]);
      const snapshots = await queryAllSnapshots();
      expect(snapshots).toHaveLength(2);
      expect(snapshots[0]?.id).toBe(1);
      expect(snapshots[1]?.url).toBe('https://b.example/');
    });

    it('returns empty array when no tabs', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([]);
      const snapshots = await queryAllSnapshots();
      expect(snapshots).toEqual([]);
    });
  });

  describe('countAllTabs', () => {
    it('returns the number of tabs from chrome.tabs.query', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([makeTab(), makeTab({ id: 2 }), makeTab({ id: 3 })]);
      const count = await countAllTabs();
      expect(count).toBe(3);
    });

    it('returns 0 when no tabs', async () => {
      const queryMock = chrome.tabs.query as ReturnType<typeof vi.fn>;
      queryMock.mockResolvedValueOnce([]);
      const count = await countAllTabs();
      expect(count).toBe(0);
    });
  });

  describe('inactiveMs', () => {
    it('returns elapsed ms when lastAccessed in the past', () => {
      const snapshot = makeSnapshot({ lastAccessed: 1_700_000_000_000 });
      expect(inactiveMs(snapshot, 1_700_000_005_000)).toBe(5000);
    });

    it('returns 0 when lastAccessed equals now', () => {
      const snapshot = makeSnapshot({ lastAccessed: 1_700_000_000_000 });
      expect(inactiveMs(snapshot, 1_700_000_000_000)).toBe(0);
    });

    it('returns 0 when lastAccessed in the future', () => {
      const snapshot = makeSnapshot({ lastAccessed: 1_700_000_100_000 });
      expect(inactiveMs(snapshot, 1_700_000_000_000)).toBe(0);
    });
  });

  describe('inactiveMinutes', () => {
    it('returns floor of minutes elapsed', () => {
      const snapshot = makeSnapshot({ lastAccessed: 1_700_000_000_000 });
      // 90s -> 1 minute
      expect(inactiveMinutes(snapshot, 1_700_000_000_000 + 90_000)).toBe(1);
      // 119s -> 1 minute
      expect(inactiveMinutes(snapshot, 1_700_000_000_000 + 119_000)).toBe(1);
      // 120s -> 2 minutes
      expect(inactiveMinutes(snapshot, 1_700_000_000_000 + 120_000)).toBe(2);
    });

    it('returns 0 when lastAccessed is in the future', () => {
      const snapshot = makeSnapshot({ lastAccessed: 1_700_000_100_000 });
      expect(inactiveMinutes(snapshot, 1_700_000_000_000)).toBe(0);
    });
  });

  describe('isInactive', () => {
    const now = 1_700_000_000_000;

    it('returns true when elapsed >= threshold', () => {
      const snapshot = makeSnapshot({ lastAccessed: now - 30 * 60_000 });
      expect(isInactive(snapshot, 30, now)).toBe(true);
    });

    it('returns false when elapsed < threshold', () => {
      const snapshot = makeSnapshot({ lastAccessed: now - 29 * 60_000 });
      expect(isInactive(snapshot, 30, now)).toBe(false);
    });

    it('uses DEFAULT_INACTIVE_THRESHOLD_MINUTES when threshold omitted', () => {
      expect(DEFAULT_INACTIVE_THRESHOLD_MINUTES).toBe(30);
      const just = makeSnapshot({ lastAccessed: now - 30 * 60_000 });
      const tooSoon = makeSnapshot({ lastAccessed: now - 29 * 60_000 });
      expect(isInactive(just, undefined, now)).toBe(true);
      expect(isInactive(tooSoon, undefined, now)).toBe(false);
    });

    it('returns false when threshold is negative', () => {
      const snapshot = makeSnapshot({ lastAccessed: now - 60 * 60_000 });
      expect(isInactive(snapshot, -1, now)).toBe(false);
    });

    it('returns false when threshold is NaN', () => {
      const snapshot = makeSnapshot({ lastAccessed: now - 60 * 60_000 });
      expect(isInactive(snapshot, Number.NaN, now)).toBe(false);
    });

    it('returns false when threshold is Infinity', () => {
      const snapshot = makeSnapshot({ lastAccessed: now - 60 * 60_000 });
      expect(isInactive(snapshot, Number.POSITIVE_INFINITY, now)).toBe(false);
    });

    it('threshold 0 returns true for any past or equal lastAccessed', () => {
      const snapshot = makeSnapshot({ lastAccessed: now });
      expect(isInactive(snapshot, 0, now)).toBe(true);
    });
  });

  describe('filterInactive', () => {
    const now = 1_700_000_000_000;

    it('keeps only snapshots past the threshold', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, lastAccessed: now - 35 * 60_000 }),
        makeSnapshot({ id: 2, lastAccessed: now - 10 * 60_000 }),
        makeSnapshot({ id: 3, lastAccessed: now - 31 * 60_000 }),
      ];
      const result = filterInactive(snapshots, 30, now);
      expect(result.map((s) => s.id)).toEqual([1, 3]);
    });

    it('returns empty array when none inactive', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, lastAccessed: now - 5 * 60_000 }),
        makeSnapshot({ id: 2, lastAccessed: now }),
      ];
      const result = filterInactive(snapshots, 30, now);
      expect(result).toEqual([]);
    });

    it('returns all snapshots when threshold is 0', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, lastAccessed: now }),
        makeSnapshot({ id: 2, lastAccessed: now - 1_000 }),
      ];
      const result = filterInactive(snapshots, 0, now);
      expect(result).toHaveLength(2);
    });

    it('returns empty array on empty input', () => {
      expect(filterInactive([], 30, now)).toEqual([]);
    });

    it('returns empty array when threshold invalid (negative)', () => {
      const snapshots: TabSnapshot[] = [makeSnapshot({ id: 1, lastAccessed: now - 60 * 60_000 })];
      expect(filterInactive(snapshots, -10, now)).toEqual([]);
    });
  });

  describe('getHostname', () => {
    it('returns lowercased hostname for valid URLs', () => {
      expect(getHostname('https://EXAMPLE.com/path?q=1')).toBe('example.com');
    });

    it('handles http URLs', () => {
      expect(getHostname('http://example.com/')).toBe('example.com');
    });

    it('returns null for empty string', () => {
      expect(getHostname('')).toBeNull();
    });

    it('returns null for invalid URL', () => {
      expect(getHostname('not a url')).toBeNull();
    });

    it('handles subdomains', () => {
      expect(getHostname('https://docs.example.com/path')).toBe('docs.example.com');
    });

    it('handles chrome:// URLs', () => {
      expect(getHostname('chrome://extensions/')).toBe('extensions');
    });

    it('handles URL with port', () => {
      expect(getHostname('https://localhost:3000/foo')).toBe('localhost');
    });
  });

  describe('groupByHostname', () => {
    it('groups snapshots by hostname', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/' }),
        makeSnapshot({ id: 2, url: 'https://b.example/' }),
        makeSnapshot({ id: 3, url: 'https://a.example/page' }),
      ];
      const groups = groupByHostname(snapshots);
      expect(groups.size).toBe(2);
      expect(groups.get('a.example')?.map((s) => s.id)).toEqual([1, 3]);
      expect(groups.get('b.example')?.map((s) => s.id)).toEqual([2]);
    });

    it('skips snapshots with no valid hostname', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/' }),
        makeSnapshot({ id: 2, url: '' }),
        makeSnapshot({ id: 3, url: 'invalid' }),
      ];
      const groups = groupByHostname(snapshots);
      expect(groups.size).toBe(1);
      expect(groups.get('a.example')?.map((s) => s.id)).toEqual([1]);
    });

    it('returns empty map for empty input', () => {
      expect(groupByHostname([]).size).toBe(0);
    });
  });

  describe('filterDuplicateHostnames', () => {
    it('returns all snapshots that share a hostname with another', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/x' }),
        makeSnapshot({ id: 2, url: 'https://a.example/y' }),
        makeSnapshot({ id: 3, url: 'https://b.example/' }),
        makeSnapshot({ id: 4, url: 'https://a.example/z' }),
      ];
      const result = filterDuplicateHostnames(snapshots);
      const ids = result.map((s) => s.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 4]);
    });

    it('returns empty array when no duplicates', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/' }),
        makeSnapshot({ id: 2, url: 'https://b.example/' }),
      ];
      expect(filterDuplicateHostnames(snapshots)).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(filterDuplicateHostnames([])).toEqual([]);
    });

    it('ignores entries without a valid URL', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: '' }),
        makeSnapshot({ id: 2, url: '' }),
        makeSnapshot({ id: 3, url: 'https://a.example/' }),
      ];
      expect(filterDuplicateHostnames(snapshots)).toEqual([]);
    });
  });

  describe('pickDuplicateClosable', () => {
    it('returns all duplicates except the most recently accessed in each group', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/', lastAccessed: 100 }),
        makeSnapshot({ id: 2, url: 'https://a.example/p', lastAccessed: 300 }),
        makeSnapshot({ id: 3, url: 'https://a.example/q', lastAccessed: 200 }),
        makeSnapshot({ id: 4, url: 'https://b.example/', lastAccessed: 500 }),
        makeSnapshot({ id: 5, url: 'https://b.example/x', lastAccessed: 400 }),
      ];
      const result = pickDuplicateClosable(snapshots);
      const ids = result.map((s) => s.id).sort((a, b) => a - b);
      // a.example: keep id=2 (latest), close 1 and 3
      // b.example: keep id=4 (latest), close 5
      expect(ids).toEqual([1, 3, 5]);
    });

    it('returns empty array when no duplicates exist', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/', lastAccessed: 100 }),
        makeSnapshot({ id: 2, url: 'https://b.example/', lastAccessed: 200 }),
      ];
      expect(pickDuplicateClosable(snapshots)).toEqual([]);
    });

    it('returns empty array for empty input', () => {
      expect(pickDuplicateClosable([])).toEqual([]);
    });

    it('does not mutate the input order', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/', lastAccessed: 100 }),
        makeSnapshot({ id: 2, url: 'https://a.example/p', lastAccessed: 300 }),
        makeSnapshot({ id: 3, url: 'https://a.example/q', lastAccessed: 200 }),
      ];
      const original = snapshots.map((s) => s.id);
      pickDuplicateClosable(snapshots);
      expect(snapshots.map((s) => s.id)).toEqual(original);
    });

    it('handles a group of exactly two by closing the older one', () => {
      const snapshots: TabSnapshot[] = [
        makeSnapshot({ id: 1, url: 'https://a.example/', lastAccessed: 100 }),
        makeSnapshot({ id: 2, url: 'https://a.example/p', lastAccessed: 200 }),
      ];
      const result = pickDuplicateClosable(snapshots);
      expect(result.map((s) => s.id)).toEqual([1]);
    });
  });
});
