import {
  STORAGE_DEFAULTS,
  type StorageKey,
  type StorageSchema,
} from '@/types/storage';

const area = (): chrome.storage.LocalStorageArea => chrome.storage.local;

export async function get<K extends StorageKey>(key: K): Promise<StorageSchema[K]> {
  const result = (await area().get(key)) as Partial<StorageSchema>;
  const value = result[key];
  return value === undefined ? STORAGE_DEFAULTS[key] : (value as StorageSchema[K]);
}

export async function getMany<K extends StorageKey>(
  keys: readonly K[],
): Promise<Pick<StorageSchema, K>> {
  const result = (await area().get(keys as unknown as string[])) as Partial<StorageSchema>;
  const out = {} as Pick<StorageSchema, K>;
  for (const k of keys) {
    const v = result[k];
    out[k] = (v === undefined ? STORAGE_DEFAULTS[k] : v) as StorageSchema[K];
  }
  return out;
}

export async function getAll(): Promise<StorageSchema> {
  const result = (await area().get(null)) as Partial<StorageSchema>;
  const out = {} as StorageSchema;
  (Object.keys(STORAGE_DEFAULTS) as StorageKey[]).forEach((k) => {
    const v = result[k];
    (out[k] as StorageSchema[typeof k]) =
      v === undefined ? STORAGE_DEFAULTS[k] : (v as StorageSchema[typeof k]);
  });
  return out;
}

export async function set<K extends StorageKey>(
  key: K,
  value: StorageSchema[K],
): Promise<void> {
  await area().set({ [key]: value });
}

export async function setMany(values: Partial<StorageSchema>): Promise<void> {
  await area().set(values);
}

export async function update<K extends StorageKey>(
  key: K,
  updater: (current: StorageSchema[K]) => StorageSchema[K],
): Promise<StorageSchema[K]> {
  const current = await get(key);
  const next = updater(current);
  await set(key, next);
  return next;
}

export async function remove(key: StorageKey | StorageKey[]): Promise<void> {
  await area().remove(key as string | string[]);
}

export async function clear(): Promise<void> {
  await area().clear();
}

export function onChanged(
  listener: (
    changes: { [K in StorageKey]?: chrome.storage.StorageChange },
  ) => void,
): () => void {
  const wrapped = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName,
  ): void => {
    if (areaName !== 'local') return;
    listener(changes as { [K in StorageKey]?: chrome.storage.StorageChange });
  };
  chrome.storage.onChanged.addListener(wrapped);
  return () => chrome.storage.onChanged.removeListener(wrapped);
}
