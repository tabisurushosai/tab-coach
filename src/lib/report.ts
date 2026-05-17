import { get, set } from '@/lib/storage';
import type { CleanupRecord } from '@/types/storage';

export const SECONDS_SAVED_PER_TAB = 15;
export const MAX_CLEANUP_HISTORY = 5000;
export const REPORT_RETENTION_MONTHS = 12;

export type CleanupCategory = CleanupRecord['category'];

export type MonthlyReport = {
  yearMonth: string;
  year: number;
  month: number;
  cleanupCount: number;
  closedTotal: number;
  savedSeconds: number;
  byCategory: Record<CleanupCategory, { cleanupCount: number; closedTotal: number }>;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

export function getYearMonthOf(timestamp: number): { year: number; month: number; key: string } {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return { year, month, key: formatYearMonth(year, month) };
}

function emptyCategoryBreakdown(): MonthlyReport['byCategory'] {
  return {
    inactive: { cleanupCount: 0, closedTotal: 0 },
    duplicate: { cleanupCount: 0, closedTotal: 0 },
    read: { cleanupCount: 0, closedTotal: 0 },
    manual: { cleanupCount: 0, closedTotal: 0 },
  };
}

export function emptyMonthlyReport(year: number, month: number): MonthlyReport {
  return {
    yearMonth: formatYearMonth(year, month),
    year,
    month,
    cleanupCount: 0,
    closedTotal: 0,
    savedSeconds: 0,
    byCategory: emptyCategoryBreakdown(),
  };
}

export function aggregateMonthlyReport(
  records: readonly CleanupRecord[],
  year: number,
  month: number,
): MonthlyReport {
  const report = emptyMonthlyReport(year, month);
  for (const record of records) {
    if (!Number.isFinite(record.at) || !Number.isFinite(record.closedCount)) continue;
    if (record.closedCount <= 0) continue;
    const at = getYearMonthOf(record.at);
    if (at.year !== year || at.month !== month) continue;
    report.cleanupCount += 1;
    report.closedTotal += record.closedCount;
    const bucket = report.byCategory[record.category];
    if (bucket !== undefined) {
      bucket.cleanupCount += 1;
      bucket.closedTotal += record.closedCount;
    }
  }
  report.savedSeconds = report.closedTotal * SECONDS_SAVED_PER_TAB;
  return report;
}

export function aggregateRecentMonths(
  records: readonly CleanupRecord[],
  months: number = REPORT_RETENTION_MONTHS,
  now: number = Date.now(),
): MonthlyReport[] {
  if (months <= 0) return [];
  const anchor = new Date(now);
  anchor.setDate(1);
  anchor.setHours(0, 0, 0, 0);
  const out: MonthlyReport[] = [];
  for (let i = 0; i < months; i += 1) {
    const ref = new Date(anchor);
    ref.setMonth(ref.getMonth() - i);
    const year = ref.getFullYear();
    const month = ref.getMonth() + 1;
    out.push(aggregateMonthlyReport(records, year, month));
  }
  return out;
}

export function getCurrentMonthReport(
  records: readonly CleanupRecord[],
  now: number = Date.now(),
): MonthlyReport {
  const { year, month } = getYearMonthOf(now);
  return aggregateMonthlyReport(records, year, month);
}

export async function loadCleanupHistory(): Promise<CleanupRecord[]> {
  return get('cleanupHistory');
}

export async function saveCleanupHistory(records: readonly CleanupRecord[]): Promise<void> {
  await set('cleanupHistory', [...records]);
}

export type RecordCleanupResult = {
  record: CleanupRecord;
  history: CleanupRecord[];
  trimmed: number;
};

export async function recordCleanup(
  closedCount: number,
  category: CleanupCategory,
  now: number = Date.now(),
): Promise<RecordCleanupResult | null> {
  if (!Number.isFinite(closedCount) || closedCount <= 0) return null;
  const record: CleanupRecord = {
    at: now,
    closedCount: Math.floor(closedCount),
    category,
  };
  const current = await loadCleanupHistory();
  const merged = [...current, record];
  const trimmed = Math.max(0, merged.length - MAX_CLEANUP_HISTORY);
  const next = trimmed === 0 ? merged : merged.slice(merged.length - MAX_CLEANUP_HISTORY);
  await saveCleanupHistory(next);
  return { record, history: next, trimmed };
}

export async function clearCleanupHistory(): Promise<void> {
  await saveCleanupHistory([]);
}
