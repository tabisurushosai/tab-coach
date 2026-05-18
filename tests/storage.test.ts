import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clear,
  get,
  getAll,
  getMany,
  onChanged,
  remove,
  set,
  setMany,
  update,
} from '@/lib/storage';
import {
  DEFAULT_SETTINGS,
  STORAGE_DEFAULTS,
  type Settings,
  type WhitelistEntry,
} from '@/types/storage';

describe('storage wrapper', () => {
  afterEach(async () => {
    await chrome.storage.local.clear();
  });

  describe('get', () => {
    it('returns the default value when key is absent', async () => {
      const settings = await get('settings');
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('returns default empty array for whitelist when absent', async () => {
      const whitelist = await get('whitelist');
      expect(whitelist).toEqual([]);
    });

    it('returns the stored value when present', async () => {
      const custom: Settings = {
        ...DEFAULT_SETTINGS,
        tabLimitYellow: 5,
        tabLimitRed: 12,
      };
      await chrome.storage.local.set({ settings: custom });
      const result = await get('settings');
      expect(result).toEqual(custom);
    });

    it('returns default for undefined readCompleted', async () => {
      const result = await get('readCompleted');
      expect(result).toEqual({});
    });

    it('returns null default for undoSnapshot', async () => {
      const result = await get('undoSnapshot');
      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('returns defaults for all requested keys when absent', async () => {
      const result = await getMany(['settings', 'whitelist', 'archive']);
      expect(result.settings).toEqual(DEFAULT_SETTINGS);
      expect(result.whitelist).toEqual([]);
      expect(result.archive).toEqual([]);
    });

    it('returns stored values when present', async () => {
      const entries: WhitelistEntry[] = [
        { pattern: 'github.com', createdAt: 1 },
      ];
      await chrome.storage.local.set({ whitelist: entries });
      const result = await getMany(['whitelist', 'archive']);
      expect(result.whitelist).toEqual(entries);
      expect(result.archive).toEqual([]);
    });
  });

  describe('getAll', () => {
    it('returns full schema with defaults when storage is empty', async () => {
      const all = await getAll();
      expect(all).toEqual(STORAGE_DEFAULTS);
    });

    it('merges stored values with defaults for missing keys', async () => {
      await chrome.storage.local.set({
        whitelist: [{ pattern: 'example.com', createdAt: 42 }],
      });
      const all = await getAll();
      expect(all.whitelist).toEqual([
        { pattern: 'example.com', createdAt: 42 },
      ]);
      expect(all.settings).toEqual(DEFAULT_SETTINGS);
      expect(all.archive).toEqual([]);
    });
  });

  describe('set', () => {
    it('persists a value retrievable via get', async () => {
      const next: Settings = {
        ...DEFAULT_SETTINGS,
        inactiveMinutes: 60,
        darkMode: 'dark',
      };
      await set('settings', next);
      const result = await get('settings');
      expect(result).toEqual(next);
    });

    it('calls the underlying chrome.storage.local.set', async () => {
      await set('whitelist', [{ pattern: 'a.com', createdAt: 1 }]);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        whitelist: [{ pattern: 'a.com', createdAt: 1 }],
      });
    });
  });

  describe('setMany', () => {
    it('persists multiple keys in one call', async () => {
      await setMany({
        whitelist: [{ pattern: 'x.com', createdAt: 1 }],
        archive: [],
      });
      const wl = await get('whitelist');
      const ar = await get('archive');
      expect(wl).toEqual([{ pattern: 'x.com', createdAt: 1 }]);
      expect(ar).toEqual([]);
      expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('reads, applies updater, and writes back', async () => {
      const next = await update('settings', (current) => ({
        ...current,
        tabLimitYellow: 7,
      }));
      expect(next.tabLimitYellow).toBe(7);
      const stored = await get('settings');
      expect(stored.tabLimitYellow).toBe(7);
    });

    it('passes the default value to the updater when absent', async () => {
      const updater = vi.fn((current: WhitelistEntry[]) => [
        ...current,
        { pattern: 'new.com', createdAt: 99 },
      ]);
      const result = await update('whitelist', updater);
      expect(updater).toHaveBeenCalledWith([]);
      expect(result).toEqual([{ pattern: 'new.com', createdAt: 99 }]);
    });
  });

  describe('remove', () => {
    it('deletes a single key so subsequent get returns default', async () => {
      await set('whitelist', [{ pattern: 'x.com', createdAt: 1 }]);
      await remove('whitelist');
      const result = await get('whitelist');
      expect(result).toEqual([]);
    });

    it('deletes multiple keys', async () => {
      await setMany({
        whitelist: [{ pattern: 'x.com', createdAt: 1 }],
        archive: [
          {
            id: 1,
            url: 'https://x.com',
            title: 'X',
            lastAccessed: 0,
            archivedAt: 0,
          },
        ],
      });
      await remove(['whitelist', 'archive']);
      expect(await get('whitelist')).toEqual([]);
      expect(await get('archive')).toEqual([]);
    });
  });

  describe('clear', () => {
    it('removes everything from storage', async () => {
      await set('whitelist', [{ pattern: 'x.com', createdAt: 1 }]);
      await clear();
      expect(chrome.storage.local.clear).toHaveBeenCalled();
      const result = await get('whitelist');
      expect(result).toEqual([]);
    });
  });

  describe('onChanged', () => {
    it('registers a listener that only fires for the local area', () => {
      const api = chrome.storage.onChanged as unknown as {
        addListener: ReturnType<typeof vi.fn>;
        removeListener: ReturnType<typeof vi.fn>;
      };

      const listener = vi.fn();
      const unsubscribe = onChanged(listener);

      expect(api.addListener).toHaveBeenCalledTimes(1);
      const wrapped = api.addListener.mock.calls[0][0] as (
        changes: Record<string, chrome.storage.StorageChange>,
        area: chrome.storage.AreaName,
      ) => void;

      wrapped({ settings: { newValue: 1, oldValue: 0 } }, 'sync');
      expect(listener).not.toHaveBeenCalled();

      wrapped({ settings: { newValue: 2, oldValue: 1 } }, 'local');
      expect(listener).toHaveBeenCalledWith({
        settings: { newValue: 2, oldValue: 1 },
      });

      unsubscribe();
      expect(api.removeListener).toHaveBeenCalledWith(wrapped);
    });
  });
});
