export function invariant(
  condition: unknown,
  message = 'Assertion Failed',
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
