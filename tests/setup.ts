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
    get: vi.fn(async (keys?: string | string[] | Record<string, unknown> | null) => {
      if (keys == null) {
        return Object.fromEntries(store);
      }
      if (typeof keys === 'string') {
        return store.has(keys) ? { [keys]: store.get(keys) } : {};
      }
      if (Array.isArray(keys)) {
        const out: Record<string, unknown> = {};
        for (const k of keys) {
          if (store.has(k)) out[k] = store.get(k);
        }
        return out;
      }
      const out: Record<string, unknown> = {};
      for (const [k, defaultValue] of Object.entries(keys)) {
        out[k] = store.has(k) ? store.get(k) : defaultValue;
      }
      return out;
    }),
    set: vi.fn(async (items: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(items)) {
        store.set(k, v);
      }
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) store.delete(k);
    }),
    clear: vi.fn(async () => {
      store.clear();
    }),
  };
};

const installChromeMock = (): void => {
  const chromeMock = {
    storage: {
      local: createStorageArea(),
    },
    i18n: {
      getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
        if (substitutions == null) return key;
        const arr = Array.isArray(substitutions) ? substitutions : [substitutions];
        return `${key}:${arr.join(',')}`;
      }),
      getUILanguage: vi.fn(() => 'en'),
    },
    runtime: {
      id: 'test-extension-id',
      sendMessage: vi.fn(async () => undefined),
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
      query: vi.fn(async () => []),
      update: vi.fn(async () => undefined),
      remove: vi.fn(async () => undefined),
      create: vi.fn(async (props: unknown) => props),
      onCreated: { addListener: vi.fn(), removeListener: vi.fn() },
      onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
      onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
      onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    action: {
      setBadgeText: vi.fn(async () => undefined),
      setBadgeBackgroundColor: vi.fn(async () => undefined),
    },
    commands: {
      onCommand: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    tabGroups: {
      query: vi.fn(async () => []),
      update: vi.fn(async () => undefined),
    },
  };

  (globalThis as unknown as { chrome: unknown }).chrome = chromeMock;
};

beforeEach(() => {
  installChromeMock();
});
