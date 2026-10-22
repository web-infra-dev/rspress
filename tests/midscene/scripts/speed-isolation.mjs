import assert from 'node:assert/strict';
import { loadTestProject } from '@midscene/test/config';

const loaded = await loadTestProject('midscene.config.ts');
const project = loaded.projects[0];
const cleanup = [];
const fileCleanup = Array.from({ length: 5 }, () => []);
try {
  const shared = await project.setup.setup({
    project,
    env: process.env,
    signal: new AbortController().signal,
    onTeardown: fn => cleanup.push(fn),
  });
  const contexts = await Promise.all(
    fileCleanup.map((callbacks, index) =>
      project.fileSetup.setup({
        project,
        projectContext: shared,
        env: process.env,
        file: {
          documentId: String(index),
          documentRunId: String(index),
          sourcePath: `isolation-${index}.yaml`,
        },
        signal: new AbortController().signal,
        onTeardown: fn => callbacks.push(fn),
      }),
    ),
  );
  assert.equal(new Set(contexts).size, 5);
  const open = loaded.resolveNode('app.open');
  await Promise.all(
    contexts.map(async (context, index) => {
      await open.execute({ context, input: open.inputSchema.parse({}) });
      await context.page.evaluate(
        value => localStorage.setItem('speed-isolation', value),
        String(index),
      );
    }),
  );
  assert.equal(new Set(contexts.map(context => context.session)).size, 5);
  for (const [index, context] of contexts.entries())
    assert.equal(
      await context.page.evaluate(() =>
        localStorage.getItem('speed-isolation'),
      ),
      String(index),
    );
  for (const fn of fileCleanup[0].splice(0).reverse()) await fn();
  assert.equal(contexts[0].page.isClosed(), true);
  for (const context of contexts.slice(1))
    assert.equal(context.page.isClosed(), false);
  console.log(
    'Five real browser contexts have isolated storage and independent teardown. No model calls.',
  );
} finally {
  try {
    for (const callbacks of fileCleanup)
      for (const fn of callbacks.reverse()) await fn();
  } finally {
    for (const fn of cleanup.reverse()) await fn();
  }
}
