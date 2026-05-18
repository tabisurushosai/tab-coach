import { beforeEach, vi } from 'vitest';

type StorageArea = {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
};

const createStorageArea = (): StorageArea => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn((keys?: string | string[] | Record<string, unknown> | null) => {
      if (keys === null || keys === undefined) {
        return Promise.resolve(Object.fromEntries(store));
      }
      if (typeof keys === 'string') {
        return Promise.resolve(store.has(keys) ? { [keys]: store.get(keys) } : {});
      }
      if (Array.isArray(keys)) {
        const out: Record<string, unknown> = {};
        for (const k of keys) {
          if (store.has(k)) out[k] = store.get(k);
        }
        return Promise.resolve(out);
      }
      const out: Record<string, unknown> = {};
      for (const [k, defaultValue] of Object.entries(keys)) {
        out[k] = store.has(k) ? store.get(k) : defaultValue;
      }
      return Promise.resolve(out);
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(items)) {
        store.set(k, v);
      }
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) store.delete(k);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
};

const installChromeMock = (): void => {
  const chromeMock = {
    storage: {
      local: createStorageArea(),
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    i18n: {
      getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
        if (substitutions === null || substitutions === undefined) return key;
        const arr = Array.isArray(substitutions) ? substitutions : [substitutions];
        return `${key}:${arr.join(',')}`;
      }),
      getUILanguage: vi.fn(() => 'en'),
    },
    runtime: {
      id: 'test-extension-id',
      sendMessage: vi.fn(() => Promise.resolve(undefined)),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn(),
      },
      getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
      lastError: null,
    },
    tabs: {
      query: vi.fn(() => Promise.resolve([])),
      update: vi.fn(() => Promise.resolve(undefined)),
      remove: vi.fn(() => Promise.resolve(undefined)),
      create: vi.fn((props: unknown) => Promise.resolve(props)),
      onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
      onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
      onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    action: {
      setBadgeText: vi.fn(() => Promise.resolve(undefined)),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve(undefined)),
    },
    commands: {
      onCommand: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabGroups: {
      query: vi.fn(() => Promise.resolve([])),
      update: vi.fn(() => Promise.resolve(undefined)),
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = chromeMock;
};

beforeEach(() => {
  installChromeMock();
});
