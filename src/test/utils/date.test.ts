import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { formatDate, isOverdue, formatRelative } from '../../utils/date';

describe('formatDate', () => {
  it('formats a date in dd.mm.yyyy', () => {
    expect(formatDate('2024-03-15')).toBe('15.03.2024');
  });

  it('formats first day of year', () => {
    expect(formatDate('2024-01-01')).toBe('01.01.2024');
  });
});

describe('isOverdue', () => {
  it('returns true for a past date', () => {
    expect(isOverdue('2000-01-01')).toBe(true);
  });

  it('returns false for a future date', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });
});

describe('formatRelative', () => {
  const BASE = new Date('2024-06-01T12:00:00Z').getTime();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "только что" for under 1 minute', () => {
    const date = new Date(BASE - 30_000).toISOString();
    expect(formatRelative(date)).toBe('только что');
  });

  it('returns minutes ago', () => {
    const date = new Date(BASE - 5 * 60_000).toISOString();
    expect(formatRelative(date)).toBe('5 мин. назад');
  });

  it('returns hours ago', () => {
    const date = new Date(BASE - 3 * 3_600_000).toISOString();
    expect(formatRelative(date)).toBe('3 ч. назад');
  });

  it('returns days ago', () => {
    const date = new Date(BASE - 2 * 86_400_000).toISOString();
    expect(formatRelative(date)).toBe('2 д. назад');
  });

  it('falls back to formatDate for dates older than 7 days', () => {
    const date = new Date(BASE - 10 * 86_400_000).toISOString();
    expect(formatRelative(date)).toBe(formatDate(date));
  });
});
