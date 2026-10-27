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

test('priority scheduling preserves every case and its steps', async t => {
  const { mkdtemp, mkdir, writeFile, readFile, readdir, rm } =
    await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const { prepareSpeedCases } = await import('./speed-cases.mjs');
  const root = await mkdtemp(path.join(tmpdir(), 'case-order-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'cases'));
  await writeFile(
    path.join(root, 'cases', 'all.yaml'),
    JSON.stringify({
      cases: [
        { name: 'FAST-01 Fast', steps: [{ aiAssert: 'fast assertion' }] },
        { name: 'SLOW-01 Slow', steps: [{ aiAssert: 'slow assertion' }] },
        { name: 'OTHER-01 Other', steps: [{ aiAssert: 'other assertion' }] },
      ],
    }),
  );
  const result = await prepareSpeedCases({
    root,
    merge: false,
    priorityIds: ['SLOW-01'],
  });
  const dir = path.join(root, path.dirname(result.pattern));
  const files = (await readdir(dir)).sort();
  assert.equal(files.length, 3);
  assert.match(files[0], /SLOW-01/);
  assert.equal(new Set(result.manifest.map(item => item.name)).size, 3);
  for (const item of result.manifest) {
    assert.equal(item.remainingAssertions, 1);
    assert.match(
      await readFile(path.join(dir, item.generated), 'utf8'),
      /assertion/,
    );
  }
});
