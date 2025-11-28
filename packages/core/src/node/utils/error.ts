/**
 * Creates an Error with a truncated stack trace.
 * Only keeps the first 5 lines of the stack trace to reduce noise.
 *
 * @param message - The error message
 * @returns An Error object with truncated stack
 */
export function createError(message: string): Error {
  const error = new Error(message);
  if (error.stack) {
    const lines = error.stack.split('\n');
    error.stack = lines.slice(0, 5).join('\n');
  }
  return error;
}
