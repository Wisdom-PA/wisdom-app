import { describe, expect, it } from 'vitest';
import type { Result } from '../src/index.js';
import { Example } from '../src/index.js';

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

describe('Example class', () => {
  it('initializes with a default message', () => {
    const ex = new Example();
    expect(ex.getMessage()).toBe('Hello from the package');
  });

  it('initializes with a custom message', () => {
    const ex = new Example('custom');
    expect(ex.getMessage()).toBe('custom');
  });

  it('updates the message', () => {
    const ex = new Example('original');
    ex.setMessage('updated');
    expect(ex.getMessage()).toBe('updated');
  });
});
