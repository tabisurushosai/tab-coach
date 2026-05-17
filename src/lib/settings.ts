import { get, update } from '@/lib/storage';
import { DEFAULT_SETTINGS, type Settings } from '@/types/storage';

export const MIN_TAB_LIMIT = 1;
export const MAX_TAB_LIMIT = 999;

export type ThresholdInput = {
  tabLimitYellow: number;
  tabLimitRed: number;
};

export type ThresholdValidationError = 'yellow_invalid' | 'red_invalid' | 'red_not_greater';

export type ThresholdValidationResult =
  | { ok: true; value: ThresholdInput }
  | { ok: false; reason: ThresholdValidationError };

function toFiniteInt(raw: unknown): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function isInLimitRange(n: number): boolean {
  return n >= MIN_TAB_LIMIT && n <= MAX_TAB_LIMIT;
}

export function validateThresholds(
  yellowRaw: unknown,
  redRaw: unknown,
): ThresholdValidationResult {
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
