import { describe, expect, it } from 'vitest';
import { createError } from './error';

describe('createError', () => {
  it('should create an error with the given message', () => {
    const error = createError('Test error message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
  });

  it('should truncate stack trace to 5 lines by default', () => {
    const error = createError('Test error message');
    expect(error.stack).toBeDefined();
    const stackLines = error.stack!.split('\n');
    expect(stackLines.length).toBeLessThanOrEqual(5);
  });

  it('should truncate stack trace to custom number of lines', () => {
    const error = createError('Test error message', 3);
    expect(error.stack).toBeDefined();
    const stackLines = error.stack!.split('\n');
    expect(stackLines.length).toBeLessThanOrEqual(3);
  });

  it('should keep original error message in stack', () => {
    const error = createError('Test error message');
    expect(error.stack).toContain('Test error message');
  });
});
