export function parseFileConcurrency(value = '1'): number {
  const concurrency = Number(value);
  if (![1, 5, 10, 15].includes(concurrency)) {
    throw new Error('File concurrency must be 1, 5, 10, or 15');
  }
  return concurrency;
}

export function benchmarkConcurrency(mode: string, value = '5'): number {
  if (mode === 'baseline' || mode === 'prompt') return 1;
  if (mode !== 'parallel' && mode !== 'combined') {
    throw new Error(`Unknown speed mode: ${mode}`);
  }
  const concurrency = parseFileConcurrency(value);
  if (concurrency === 1) {
    throw new Error('Parallel benchmark concurrency must be 5, 10, or 15');
  }
  return concurrency;
}
