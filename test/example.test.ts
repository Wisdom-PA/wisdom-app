import { describe, expect, it } from 'vitest';
import type { Result } from '../src/result.ts';

describe('Result type', () => {
  it('represents success values', () => {
    const result: Result<string> = { ok: true, value: 'success' };
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe('success');
    }
  });

  it('represents error values', () => {
    const result: Result<string> = { ok: false, error: new Error('failed') };
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('failed');
    }
  });
});
