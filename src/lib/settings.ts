import { get, update } from '@/lib/storage';
import { DEFAULT_SETTINGS, type Settings } from '@/types/storage';

const DARK_MODE_VALUES: readonly Settings['darkMode'][] = ['auto', 'light', 'dark'];

export type DarkModeValue = Settings['darkMode'];

export function isDarkModeValue(value: unknown): value is DarkModeValue {
  return typeof value === 'string' && (DARK_MODE_VALUES as readonly string[]).includes(value);
}

export async function saveDarkMode(value: DarkModeValue): Promise<Settings> {
  return update('settings', (current) => ({
    ...current,
    darkMode: value,
  }));
}

export const MIN_TAB_LIMIT = 1;
export const MAX_TAB_LIMIT = 999;
export const MIN_INACTIVE_MINUTES = 1;
export const MAX_INACTIVE_MINUTES = 1440;
export const MIN_FONT_SCALE = 0.8;
export const MAX_FONT_SCALE = 1.5;
export const FONT_SCALE_STEP = 0.05;

export type ThresholdInput = {
  tabLimitYellow: number;
  tabLimitRed: number;
};

export type ThresholdValidationError = 'yellow_invalid' | 'red_invalid' | 'red_not_greater';

export type ThresholdValidationResult =
  | { ok: true; value: ThresholdInput }
  | { ok: false; reason: ThresholdValidationError };

export type InactiveMinutesValidationError = 'inactive_invalid';

export type InactiveMinutesValidationResult =
  | { ok: true; value: number }
  | { ok: false; reason: InactiveMinutesValidationError };

export type FontScaleValidationError = 'font_scale_invalid';

export type FontScaleValidationResult =
  | { ok: true; value: number }
  | { ok: false; reason: FontScaleValidationError };

function toFiniteInt(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function isInLimitRange(n: number): boolean {
  return n >= MIN_TAB_LIMIT && n <= MAX_TAB_LIMIT;
}

function isInInactiveRange(n: number): boolean {
  return n >= MIN_INACTIVE_MINUTES && n <= MAX_INACTIVE_MINUTES;
}

function toFiniteNumber(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

function quantizeFontScale(n: number): number {
  const steps = Math.round((n - MIN_FONT_SCALE) / FONT_SCALE_STEP);
  const quantized = MIN_FONT_SCALE + steps * FONT_SCALE_STEP;
  return Math.round(quantized * 100) / 100;
}

export function validateThresholds(yellowRaw: unknown, redRaw: unknown): ThresholdValidationResult {
  const yellow = toFiniteInt(yellowRaw);
  if (yellow === null || !isInLimitRange(yellow)) {
    return { ok: false, reason: 'yellow_invalid' };
  }
  const red = toFiniteInt(redRaw);
  if (red === null || !isInLimitRange(red)) {
    return { ok: false, reason: 'red_invalid' };
  }
  if (red <= yellow) {
    return { ok: false, reason: 'red_not_greater' };
  }
  return { ok: true, value: { tabLimitYellow: yellow, tabLimitRed: red } };
}

export function validateInactiveMinutes(raw: unknown): InactiveMinutesValidationResult {
  const n = toFiniteInt(raw);
  if (n === null || !isInInactiveRange(n)) {
    return { ok: false, reason: 'inactive_invalid' };
  }
  return { ok: true, value: n };
}

export async function loadSettings(): Promise<Settings> {
  return get('settings');
}

export async function saveThresholds(value: ThresholdInput): Promise<Settings> {
  return update('settings', (current) => ({
    ...current,
    tabLimitYellow: value.tabLimitYellow,
    tabLimitRed: value.tabLimitRed,
  }));
}

export async function resetThresholds(): Promise<Settings> {
  return saveThresholds({
    tabLimitYellow: DEFAULT_SETTINGS.tabLimitYellow,
    tabLimitRed: DEFAULT_SETTINGS.tabLimitRed,
  });
}

export async function saveInactiveMinutes(value: number): Promise<Settings> {
  return update('settings', (current) => ({
    ...current,
    inactiveMinutes: value,
  }));
}

export async function resetInactiveMinutes(): Promise<Settings> {
  return saveInactiveMinutes(DEFAULT_SETTINGS.inactiveMinutes);
}

export function validateFontScale(raw: unknown): FontScaleValidationResult {
  const n = toFiniteNumber(raw);
  if (n === null || n < MIN_FONT_SCALE || n > MAX_FONT_SCALE) {
    return { ok: false, reason: 'font_scale_invalid' };
  }
  return { ok: true, value: quantizeFontScale(n) };
}

export async function saveFontScale(value: number): Promise<Settings> {
  return update('settings', (current) => ({
    ...current,
    fontScale: value,
  }));
}

export async function resetFontScale(): Promise<Settings> {
  return saveFontScale(DEFAULT_SETTINGS.fontScale);
}

export async function saveHighContrast(enabled: boolean): Promise<Settings> {
  return update('settings', (current) => ({
    ...current,
    highContrast: enabled,
  }));
}
