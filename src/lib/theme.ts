import type { Settings } from '@/types/storage';

export type ThemeMode = Settings['darkMode'];
export type ResolvedTheme = 'light' | 'dark';

const THEME_MODES: readonly ThemeMode[] = ['auto', 'light', 'dark'];

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return prefersDark() ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = resolveTheme(mode);
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.dataset['theme'] = resolved;
  }
  return resolved;
}

export function applyFontScale(scale: number): void {
  if (typeof document === 'undefined' || !document.documentElement) return;
  if (!Number.isFinite(scale) || scale <= 0) {
    document.documentElement.style.removeProperty('--font-scale');
    return;
  }
  document.documentElement.style.setProperty('--font-scale', String(scale));
}

export function applyHighContrast(enabled: boolean): void {
  if (typeof document === 'undefined' || !document.documentElement) return;
  if (enabled) {
    document.documentElement.dataset['contrast'] = 'high';
  } else {
    delete document.documentElement.dataset['contrast'];
  }
}

export function getCurrentResolvedTheme(): ResolvedTheme {
  if (typeof document !== 'undefined' && document.documentElement) {
    const v = document.documentElement.dataset['theme'];
    if (v === 'dark') return 'dark';
    if (v === 'light') return 'light';
  }
  return prefersDark() ? 'dark' : 'light';
}

export type ThemeUnlisten = () => void;

export function installSystemThemeListener(onChange: (resolved: ResolvedTheme) => void): ThemeUnlisten {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (): void => {
    onChange(mq.matches ? 'dark' : 'light');
  };
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }
  if (typeof mq.addListener === 'function') {
    mq.addListener(listener);
    return () => mq.removeListener(listener);
  }
  return () => {};
}
