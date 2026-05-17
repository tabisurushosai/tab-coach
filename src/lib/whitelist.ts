import { get, set } from '@/lib/storage';
import type { WhitelistEntry } from '@/types/storage';

export const MAX_PATTERN_LENGTH = 256;
export const MAX_NOTE_LENGTH = 200;
export const MAX_ENTRIES = 200;

export type AddEntryResult =
  | { ok: true; entries: WhitelistEntry[]; entry: WhitelistEntry }
  | { ok: false; reason: 'empty' | 'too_long' | 'duplicate' | 'limit_reached' };

export function normalizePattern(raw: string): string {
  return raw.trim();
}

export function isValidPattern(raw: string): boolean {
  const p = normalizePattern(raw);
  if (p.length === 0) return false;
  if (p.length > MAX_PATTERN_LENGTH) return false;
  return true;
}

export async function loadWhitelist(): Promise<WhitelistEntry[]> {
  return get('whitelist');
}

export async function saveWhitelist(entries: readonly WhitelistEntry[]): Promise<void> {
  await set('whitelist', [...entries]);
}

export async function addWhitelistEntry(
  rawPattern: string,
  rawNote?: string,
  now: number = Date.now(),
): Promise<AddEntryResult> {
  const pattern = normalizePattern(rawPattern);
  if (pattern.length === 0) return { ok: false, reason: 'empty' };
  if (pattern.length > MAX_PATTERN_LENGTH) return { ok: false, reason: 'too_long' };

  const note = typeof rawNote === 'string' ? rawNote.trim().slice(0, MAX_NOTE_LENGTH) : '';
  const current = await loadWhitelist();
  if (current.some((e) => e.pattern === pattern)) {
    return { ok: false, reason: 'duplicate' };
  }
  if (current.length >= MAX_ENTRIES) {
    return { ok: false, reason: 'limit_reached' };
  }
  const entry: WhitelistEntry = { pattern, createdAt: now };
  if (note.length > 0) entry.note = note;
  const next = [...current, entry];
  await saveWhitelist(next);
  return { ok: true, entries: next, entry };
}

export async function removeWhitelistEntry(pattern: string): Promise<WhitelistEntry[]> {
  const target = normalizePattern(pattern);
  const current = await loadWhitelist();
  const next = current.filter((e) => e.pattern !== target);
  if (next.length === current.length) return current;
  await saveWhitelist(next);
  return next;
}
