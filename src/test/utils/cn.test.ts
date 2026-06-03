import { describe, it, expect } from 'vitest';
import { cn } from '../../utils/cn';

describe('cn', () => {
  it('joins two class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', undefined, false, null, 'bar')).toBe('foo bar');
  });

  it('returns empty string when all values are falsy', () => {
    expect(cn(undefined, false, null)).toBe('');
  });

  it('returns single class as-is', () => {
    expect(cn('only')).toBe('only');
  });

  it('handles empty call', () => {
    expect(cn()).toBe('');
  });
});
