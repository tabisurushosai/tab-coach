import { describe, expect, it } from 'vitest';
import {
  filterDuplicateHostnames,
  filterInactive,
  groupByHostname,
  pickDuplicateClosable,
  toSnapshot,
} from '@/lib/tabs';
import { filterOutWhitelisted, matchesWhitelist } from '@/lib/whitelist';
import { createUndoSnapshot } from '@/lib/snapshot';
import type { TabSnapshot, WhitelistEntry } from '@/types/storage';

type TabWithAccess = chrome.tabs.Tab & { lastAccessed?: number };

const PERFORMANCE_BUDGET_MS = 1000;
const TAB_COUNT = 100;

const HOSTNAMES = [
  'example.com',
  'github.com',
  'google.com',
  'wikipedia.org',
  'reddit.com',
  'youtube.com',
  'stackoverflow.com',
  'mozilla.org',
  'medium.com',
  'news.ycombinator.com',
];

const makeTab = (index: number, now: number): TabWithAccess => {
  const host = HOSTNAMES[index % HOSTNAMES.length];
  const inactiveOffset = (index % 4 === 0 ? 60 : 5) * 60_000;
  return {
    id: index + 1,
    index,
    windowId: 1,
    highlighted: false,
    active: false,
    pinned: false,
    url: `https://${host}/page/${index}`,
    title: `Tab ${index} - ${host}`,
    favIconUrl: `https://${host}/favicon.ico`,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    groupId: -1,
    lastAccessed: now - inactiveOffset,
  };
};

const buildSnapshots = (count: number, now: number): TabSnapshot[] => {
  const tabs: TabSnapshot[] = [];
  for (let i = 0; i < count; i++) {
    tabs.push(toSnapshot(makeTab(i, now), now));
  }
  return tabs;
};

const buildWhitelist = (now: number): WhitelistEntry[] => [
  { pattern: 'https://github.com/*', createdAt: now },
  { pattern: 'https://*.mozilla.org/*', createdAt: now },
  { pattern: 'https://news.ycombinator.com/*', createdAt: now },
];

describe('performance', () => {
  it('classifies 100 tabs (inactive + duplicates + whitelist filter) within 1 second', () => {
    const now = Date.now();
    const snapshots = buildSnapshots(TAB_COUNT, now);
    const whitelist = buildWhitelist(now);

    const start = performance.now();
    const survivors = filterOutWhitelisted(snapshots, whitelist);
    const inactive = filterInactive(survivors, 30, now);
    const duplicates = filterDuplicateHostnames(survivors);
    const closableDuplicates = pickDuplicateClosable(survivors);
    const grouped = groupByHostname(survivors);
    const elapsed = performance.now() - start;

    expect(snapshots).toHaveLength(TAB_COUNT);
    expect(survivors.length).toBeLessThan(snapshots.length);
    expect(inactive.length).toBeGreaterThan(0);
    expect(duplicates.length).toBeGreaterThan(0);
    expect(closableDuplicates.length).toBeLessThan(duplicates.length);
    expect(grouped.size).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
  });

  it('creates an undo snapshot of 100 tabs within 1 second', () => {
    const now = Date.now();
    const snapshots = buildSnapshots(TAB_COUNT, now);

    const start = performance.now();
    const undo = createUndoSnapshot(snapshots, 30_000, now);
    const elapsed = performance.now() - start;

    expect(undo.tabs).toHaveLength(TAB_COUNT);
    expect(undo.expiresAt).toBe(now + 30_000);
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
  });

  it('matches whitelist against 100 URLs within 1 second', () => {
    const now = Date.now();
    const snapshots = buildSnapshots(TAB_COUNT, now);
    const whitelist = buildWhitelist(now);

    const start = performance.now();
    let matchCount = 0;
    for (const snapshot of snapshots) {
      if (matchesWhitelist(snapshot.url, whitelist)) matchCount++;
    }
    const elapsed = performance.now() - start;

    expect(matchCount).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
  });

  it('runs the full cleanup pipeline (filter → snapshot) on 100 tabs within 1 second', () => {
    const now = Date.now();
    const snapshots = buildSnapshots(TAB_COUNT, now);
    const whitelist = buildWhitelist(now);

    const start = performance.now();
    const survivors = filterOutWhitelisted(snapshots, whitelist);
    const inactive = filterInactive(survivors, 30, now);
    const duplicates = pickDuplicateClosable(survivors);
    const closableMap = new Map<number, TabSnapshot>();
    for (const t of inactive) closableMap.set(t.id, t);
    for (const t of duplicates) closableMap.set(t.id, t);
    const closable = [...closableMap.values()];
    const undo = createUndoSnapshot(closable, 30_000, now);
    const elapsed = performance.now() - start;

    expect(closable.length).toBeGreaterThan(0);
    expect(undo.tabs).toHaveLength(closable.length);
    expect(elapsed).toBeLessThan(PERFORMANCE_BUDGET_MS);
  });
});
