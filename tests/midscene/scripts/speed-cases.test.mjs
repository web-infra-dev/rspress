import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeAssertions } from './speed-cases.mjs';

test('only adjacent assertions move into an action, preserving input and file options', () => {
  const source = [
    { 'app.open': {} },
    { aiAssert: 'initial state' },
    {
      aiAct: {
        prompt: 'upload',
        options: { fileChooserAccept: 'fixture.json' },
      },
    },
    { aiAssert: 'uploaded state' },
    { 'fixture.update': {} },
    { aiAssert: 'updated state' },
  ];
  const saved = structuredClone(source);
  const result = mergeAssertions(source);
  assert.equal(result.merged, 1);
  assert.equal(result.steps[1].aiAssert, 'initial state');
  assert.match(result.steps[2].aiAct.prompt, /uploaded state/);
  assert.deepEqual(result.steps[2].aiAct.options, {
    fileChooserAccept: 'fixture.json',
  });
  assert.equal(result.steps[4].aiAssert, 'updated state');
  assert.deepEqual(source, saved);
});

test('consecutive assertions are preserved in one prompt', () => {
  const result = mergeAssertions([
    { aiAct: 'select' },
    { aiAssert: 'A' },
    { aiAssert: 'B' },
  ]);
  assert.equal(result.merged, 2);
  assert.equal(result.steps.length, 1);
  assert.match(result.steps[0].aiAct, /\nA\n/);
  assert.match(result.steps[0].aiAct, /\nB\n/);
});
