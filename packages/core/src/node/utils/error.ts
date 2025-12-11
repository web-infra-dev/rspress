/**
 * Creates an Error with a truncated stack trace.
 * Only keeps the first N lines of the stack trace to reduce noise.
 *
 * @param message - The error message
 * @param maxStackLines - Maximum number of stack trace lines to keep (default: 5)
 * @returns An Error object with truncated stack
 */
export function createError(message: string, maxStackLines = 5): Error {
  const error = new Error(message);
  if (error.stack) {
    const lines = error.stack.split('\n');
    if (lines.length > maxStackLines + 1) {
      error.stack = `${lines.slice(0, maxStackLines + 1).join('\n')}\n    ... (truncated)`;
    }
  }
  return error;
}
