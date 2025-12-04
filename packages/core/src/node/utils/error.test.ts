import { describe, expect, it } from 'vitest';
import { createError } from './error';

describe('createError', () => {
  it('should create an error with the given message', () => {
    const error = createError('Test error message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
  });

  it('should not truncate short stacks', () => {
    const error = createError('Test error message', 100);
    expect(error.stack).toBeDefined();
    expect(error.stack).not.toContain('... (truncated)');
  });

  it('should truncate when limit is 1', () => {
    function deepCall() {
      return createError('Test error message', 1);
    }
    const error = deepCall();
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('... (truncated)');
    const lines = error.stack!.split('\n');
    // Should have: error message line (1) + stack trace line (1) + truncated indicator (1) = 3 lines
    expect(lines.length).toBe(3);
  });

  it('should truncate when limit is 3 with deep call stack', () => {
    function level3() {
      return createError('Test error message', 3);
    }
    function level2() {
      return level3();
    }
    function level1() {
      return level2();
    }
    const error = level1();
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('... (truncated)');
    const lines = error.stack!.split('\n');
    // Should have: error message line (1) + 3 stack trace lines + truncated indicator (1) = 5 lines
    expect(lines.length).toBe(5);
  });

  it('should keep original error message in stack', () => {
    const error = createError('Test error message');
    expect(error.stack).toContain('Test error message');
  });
});
