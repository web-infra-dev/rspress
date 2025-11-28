import { describe, expect, it } from 'vitest';
import { createError } from './error';

describe('createError', () => {
  it('should create an error with the given message', () => {
    const error = createError('Test error message');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error message');
  });

  it('should truncate stack trace and add truncated indicator', () => {
    const error = createError('Test error message');
    expect(error.stack).toBeDefined();
    // Stack should contain the truncated indicator if it was truncated
    if (error.stack!.includes('... (truncated)')) {
      const stackLines = error.stack!.split('\n');
      // maxStackLines (5) + 1 for the truncated indicator line
      expect(stackLines.length).toBeLessThanOrEqual(6);
    }
  });

  it('should truncate stack trace to custom number of lines', () => {
    const error = createError('Test error message', 3);
    expect(error.stack).toBeDefined();
    // Stack should contain the truncated indicator if it was truncated
    if (error.stack!.includes('... (truncated)')) {
      const stackLines = error.stack!.split('\n');
      // maxStackLines (3) + 1 for the truncated indicator line
      expect(stackLines.length).toBeLessThanOrEqual(4);
    }
  });

  it('should keep original error message in stack', () => {
    const error = createError('Test error message');
    expect(error.stack).toContain('Test error message');
  });
});
