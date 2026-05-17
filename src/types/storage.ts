export type TabSnapshot = {
  id: number;
  url: string;
  title: string;
  favIconUrl?: string;
  lastAccessed: number;
  windowId?: number;
  pinned?: boolean;
};

export type WhitelistEntry = {
  pattern: string;
  createdAt: number;
  note?: string;
};

export type Settings = {
  tabLimitYellow: number;
  tabLimitRed: number;
  inactiveMinutes: number;
  darkMode: 'auto' | 'light' | 'dark';
  fontScale: number;
  highContrast: boolean;
};

export type ArchivedTab = TabSnapshot & {
  archivedAt: number;
};

export type CleanupRecord = {
  at: number;
  closedCount: number;
  category: 'inactive' | 'duplicate' | 'read' | 'manual';
};

export type UndoSnapshot = {
  at: number;
  tabs: TabSnapshot[];
  expiresAt: number;
};

export type StorageSchema = {
  settings: Settings;
  whitelist: WhitelistEntry[];
  archive: ArchivedTab[];
  cleanupHistory: CleanupRecord[];
  undoSnapshot: UndoSnapshot | null;
  readCompleted: Record<string, number>;
};

export type StorageKey = keyof StorageSchema;

export const DEFAULT_SETTINGS: Settings = {
  tabLimitYellow: 10,
  tabLimitRed: 20,
  inactiveMinutes: 30,
  darkMode: 'auto',
  fontScale: 1.0,
  highContrast: false,
};

export const STORAGE_DEFAULTS: StorageSchema = {
  settings: DEFAULT_SETTINGS,
  whitelist: [],
  archive: [],
  cleanupHistory: [],
  undoSnapshot: null,
  readCompleted: {},
};
