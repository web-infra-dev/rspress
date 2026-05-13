import fs from 'node:fs/promises';
import path from 'node:path';
import test, { expect } from '@playwright/test';
import { remarkImage } from '@rspress/core';
import picocolors from 'picocolors';
import { remark } from 'remark';
import remarkStringify from 'remark-stringify';
import { lintRule } from 'unified-lint-rule';

import config from './rspress.config.mjs';

const checkDeadImages = lintRule('check-dead-images', (tree, file) => {
  remarkImage({
    docDirectory: config.root,
    remarkImageOptions: config.markdown.image,
    lint: true,
  })(tree, file);
});

test.describe('check dead images', async () => {
  test('should not throw on unknown MDX nodes and report dead images via remark message', async () => {
    const filepath = path.resolve(import.meta.dirname, 'doc/index.md');
    // remark without remark-mdx: would throw "Cannot handle unknown node `mdxjsEsm`"
    // if remarkImage transforms nodes even in lint mode
    const { messages } = await remark()
      .use(checkDeadImages)
      .use(remarkStringify)
      .process({ path: filepath, value: await fs.readFile(filepath) });
    expect(messages).toHaveLength(1);
    expect(messages[0].reason).toBe(
      `Dead images found:\n  ${picocolors.green(`"![..](./not-exist.png)"`)} ${picocolors.gray(path.resolve(import.meta.dirname, 'doc/not-exist.png'))}`,
    );
  });
});
