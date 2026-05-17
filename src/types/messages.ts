export type ReadingProgressMessage = {
  type: 'READING_PROGRESS';
  url: string;
  maxScrollPercent: number;
  dwellMs: number;
  reportedAt: number;
};

export type RuntimeMessage = ReadingProgressMessage;

export function isReadingProgressMessage(value: unknown): value is ReadingProgressMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    m['type'] === 'READING_PROGRESS' &&
    typeof m['url'] === 'string' &&
    typeof m['maxScrollPercent'] === 'number' &&
    typeof m['dwellMs'] === 'number' &&
    typeof m['reportedAt'] === 'number'
  );
}
