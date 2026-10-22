import assert from 'node:assert/strict';
import test from 'node:test';
import {
  benchmarkConcurrency,
  parseFileConcurrency,
} from './speed-concurrency.ts';

test('normal runs remain serial and the parallel benchmark defaults to five files', () => {
  assert.equal(parseFileConcurrency(), 1);
  assert.equal(benchmarkConcurrency('parallel'), 5);
  assert.equal(benchmarkConcurrency('combined'), 5);
});

test('parallel benchmarks support higher concurrency without changing serial controls', () => {
  for (const value of ['5', '10', '15', '20', '30']) {
    for (const mode of ['parallel', 'combined']) {
      assert.equal(benchmarkConcurrency(mode, value), Number(value));
    }
    for (const mode of ['baseline', 'prompt']) {
      assert.equal(benchmarkConcurrency(mode, value), 1);
    }
  }
});

test('invalid concurrency and unknown modes fail before model work', () => {
  for (const value of [
    '',
    '0',
    '-1',
    '2',
    '5.5',
    '16',
    '31',
    'Infinity',
    'NaN',
  ]) {
    assert.throws(() => parseFileConcurrency(value), /File concurrency/);
  }
  assert.throws(
    () => benchmarkConcurrency('parallel', '1'),
    /Parallel benchmark/,
  );
  assert.throws(() => benchmarkConcurrency('unknown'), /Unknown speed mode/);
});
