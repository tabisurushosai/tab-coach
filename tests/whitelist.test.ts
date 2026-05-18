import { afterEach, describe, expect, it } from 'vitest';
import {
  MAX_ENTRIES,
  MAX_NOTE_LENGTH,
  MAX_PATTERN_LENGTH,
  addWhitelistEntry,
  filterOutWhitelisted,
  globToRegExp,
  isValidPattern,
  loadWhitelist,
  matchesPattern,
  matchesWhitelist,
  normalizePattern,
  removeWhitelistEntry,
  saveWhitelist,
} from '@/lib/whitelist';
import type { WhitelistEntry } from '@/types/storage';

const makeEntry = (overrides: Partial<WhitelistEntry> = {}): WhitelistEntry => ({
  pattern: 'https://example.com/*',
  createdAt: 1_700_000_000_000,
  ...overrides,
});

describe('whitelist', () => {
  afterEach(async () => {
    await chrome.storage.local.clear();
  });

  describe('globToRegExp', () => {
    it('converts * to .* and anchors the regex', () => {
      const re = globToRegExp('https://example.com/*');
      expect(re.test('https://example.com/')).toBe(true);
      expect(re.test('https://example.com/path?q=1')).toBe(true);
      expect(re.test('https://other.com/')).toBe(false);
    });

    it('escapes regex metacharacters in the pattern', () => {
      const re = globToRegExp('https://example.com/a.b+c?d');
      expect(re.test('https://example.com/a.b+c?d')).toBe(true);
      expect(re.test('https://example.com/aXbXcXd')).toBe(false);
    });

    it('is case-insensitive', () => {
      const re = globToRegExp('https://EXAMPLE.com/*');
      expect(re.test('https://example.com/foo')).toBe(true);
    });

    it('matches a bare * against any string', () => {
      const re = globToRegExp('*');
      expect(re.test('')).toBe(true);
      expect(re.test('https://anything/')).toBe(true);
    });
  });

  describe('matchesPattern', () => {
    it('returns false for empty url or pattern', () => {
      expect(matchesPattern('', 'https://example.com/*')).toBe(false);
      expect(matchesPattern('https://example.com/', '')).toBe(false);
    });

    it('matches when pattern covers the url', () => {
      expect(matchesPattern('https://example.com/page', 'https://example.com/*')).toBe(true);
    });

    it('does not match when pattern does not cover the url', () => {
      expect(matchesPattern('https://other.com/', 'https://example.com/*')).toBe(false);
    });

    it('requires the whole url to match (anchored)', () => {
      expect(matchesPattern('https://example.com/foo', 'https://example.com/')).toBe(false);
    });
  });

  describe('matchesWhitelist', () => {
    it('returns false for empty url', () => {
      expect(matchesWhitelist('', [makeEntry()])).toBe(false);
    });

    it('returns false when entry list is empty', () => {
      expect(matchesWhitelist('https://example.com/', [])).toBe(false);
    });

    it('returns true if any entry matches', () => {
      const entries = [
        makeEntry({ pattern: 'https://foo.com/*' }),
        makeEntry({ pattern: 'https://example.com/*' }),
      ];
      expect(matchesWhitelist('https://example.com/x', entries)).toBe(true);
    });

    it('returns false when no entry matches', () => {
      const entries = [makeEntry({ pattern: 'https://foo.com/*' })];
      expect(matchesWhitelist('https://example.com/', entries)).toBe(false);
    });
  });

  describe('filterOutWhitelisted', () => {
    it('returns a copy when whitelist is empty', () => {
      const items = [{ url: 'https://example.com/' }];
      const result = filterOutWhitelisted(items, []);
      expect(result).toEqual(items);
      expect(result).not.toBe(items);
    });

    it('removes items whose url matches any whitelist entry', () => {
      const items = [
        { url: 'https://example.com/a' },
        { url: 'https://other.com/' },
        { url: 'https://example.com/b' },
      ];
      const entries = [makeEntry({ pattern: 'https://example.com/*' })];
      const result = filterOutWhitelisted(items, entries);
      expect(result).toEqual([{ url: 'https://other.com/' }]);
    });

    it('keeps items when no entry matches', () => {
      const items = [{ url: 'https://other.com/' }];
      const entries = [makeEntry({ pattern: 'https://example.com/*' })];
      expect(filterOutWhitelisted(items, entries)).toEqual(items);
    });
  });

  describe('normalizePattern', () => {
    it('trims surrounding whitespace', () => {
      expect(normalizePattern('  https://example.com/*  ')).toBe('https://example.com/*');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(normalizePattern('   ')).toBe('');
    });
  });

  describe('isValidPattern', () => {
    it('rejects empty patterns', () => {
      expect(isValidPattern('')).toBe(false);
      expect(isValidPattern('   ')).toBe(false);
    });

    it('rejects patterns longer than MAX_PATTERN_LENGTH', () => {
      expect(isValidPattern('a'.repeat(MAX_PATTERN_LENGTH + 1))).toBe(false);
    });

    it('accepts patterns at the max length', () => {
      expect(isValidPattern('a'.repeat(MAX_PATTERN_LENGTH))).toBe(true);
    });

    it('accepts a normal pattern', () => {
      expect(isValidPattern('https://example.com/*')).toBe(true);
    });
  });

  describe('loadWhitelist / saveWhitelist', () => {
    it('returns empty array by default', async () => {
      expect(await loadWhitelist()).toEqual([]);
    });

    it('round-trips entries through storage', async () => {
      const entries = [makeEntry({ pattern: 'https://a.com/*' })];
      await saveWhitelist(entries);
      expect(await loadWhitelist()).toEqual(entries);
    });

    it('saveWhitelist persists an independent copy', async () => {
      const entries = [makeEntry({ pattern: 'https://a.com/*' })];
      await saveWhitelist(entries);
      entries.push(makeEntry({ pattern: 'https://b.com/*' }));
      expect(await loadWhitelist()).toHaveLength(1);
    });
  });

  describe('addWhitelistEntry', () => {
    it('rejects an empty pattern', async () => {
      const res = await addWhitelistEntry('   ');
      expect(res).toEqual({ ok: false, reason: 'empty' });
      expect(await loadWhitelist()).toEqual([]);
    });

    it('rejects a too-long pattern', async () => {
      const res = await addWhitelistEntry('a'.repeat(MAX_PATTERN_LENGTH + 1));
      expect(res).toEqual({ ok: false, reason: 'too_long' });
    });

    it('adds a valid entry with the given timestamp', async () => {
      const res = await addWhitelistEntry('https://example.com/*', undefined, 12345);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.entry).toEqual({ pattern: 'https://example.com/*', createdAt: 12345 });
      expect(res.entries).toHaveLength(1);
      expect(await loadWhitelist()).toEqual([res.entry]);
    });

    it('trims the pattern before storing', async () => {
      const res = await addWhitelistEntry('  https://example.com/*  ', undefined, 1);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.entry.pattern).toBe('https://example.com/*');
    });

    it('attaches a trimmed note when provided', async () => {
      const res = await addWhitelistEntry('https://example.com/*', '  important  ', 1);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.entry.note).toBe('important');
    });

    it('omits the note property when blank', async () => {
      const res = await addWhitelistEntry('https://example.com/*', '   ', 1);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.entry.note).toBeUndefined();
      expect('note' in res.entry).toBe(false);
    });

    it('truncates an over-long note', async () => {
      const long = 'x'.repeat(MAX_NOTE_LENGTH + 50);
      const res = await addWhitelistEntry('https://example.com/*', long, 1);
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.entry.note).toHaveLength(MAX_NOTE_LENGTH);
    });

    it('rejects duplicate patterns', async () => {
      await addWhitelistEntry('https://example.com/*', undefined, 1);
      const res = await addWhitelistEntry('https://example.com/*', undefined, 2);
      expect(res).toEqual({ ok: false, reason: 'duplicate' });
      expect(await loadWhitelist()).toHaveLength(1);
    });

    it('rejects when the entry limit is reached', async () => {
      const full = Array.from({ length: MAX_ENTRIES }, (_, i) =>
        makeEntry({ pattern: `https://site${i}.com/*`, createdAt: i }),
      );
      await saveWhitelist(full);
      const res = await addWhitelistEntry('https://new.com/*', undefined, 999);
      expect(res).toEqual({ ok: false, reason: 'limit_reached' });
    });
  });

  describe('removeWhitelistEntry', () => {
    it('removes a matching entry and persists the result', async () => {
      await addWhitelistEntry('https://a.com/*', undefined, 1);
      await addWhitelistEntry('https://b.com/*', undefined, 2);
      const next = await removeWhitelistEntry('https://a.com/*');
      expect(next.map((e) => e.pattern)).toEqual(['https://b.com/*']);
      expect(await loadWhitelist()).toEqual(next);
    });

    it('trims the supplied pattern before matching', async () => {
      await addWhitelistEntry('https://a.com/*', undefined, 1);
      const next = await removeWhitelistEntry('  https://a.com/*  ');
      expect(next).toEqual([]);
    });

    it('returns the current list unchanged when nothing matches', async () => {
      await addWhitelistEntry('https://a.com/*', undefined, 1);
      const before = await loadWhitelist();
      const next = await removeWhitelistEntry('https://does-not-exist.com/*');
      expect(next).toEqual(before);
    });
  });
});
