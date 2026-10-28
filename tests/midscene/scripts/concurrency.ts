export function parseFileConcurrency(value = '1'): number {
  const concurrency = Number(value);
  if (![1, 5, 10, 15, 20, 30, 40, 60].includes(concurrency)) {
    throw new Error('File concurrency must be 1, 5, 10, 15, 20, 30, 40, or 60');
  }
  return concurrency;
}
