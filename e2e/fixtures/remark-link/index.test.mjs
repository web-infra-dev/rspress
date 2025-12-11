import fs from 'node:fs/promises';
import path from 'node:path';
import test, { expect } from '@playwright/test';
import { PluginDriver, RouteService, remarkLink } from '@rspress/core';
import picocolors from 'picocolors';
import { remark } from 'remark';
import { lintRule } from 'unified-lint-rule';

import config from './rspress.config.mjs';

const pluginDriver = await PluginDriver.create(
  config,
  path.resolve(import.meta.dirname, 'rspress.config.mjs'),
  false,
);
const routeService = await RouteService.create({
  config,
  scanDir: config.root,
  externalPages: await pluginDriver.addPages(),
});

const checkDeadLinks = lintRule('check-dead-links', async (tree, file) => {
  remarkLink({
    cleanUrls: false,
    routeService,
    remarkLinkOptions: config.markdown.link,
    lint: true,
  })(tree, file);
});

test.describe('check dead links', async () => {
  test('should report dead links via remark message', async () => {
    const filepath = path.resolve(import.meta.dirname, 'doc/index.md');
    const { messages } = await remark()
      .use(checkDeadLinks)
      .process({ path: filepath, value: await fs.readFile(filepath) });
    expect(messages).toHaveLength(1);
    expect(messages[0].reason).toBe(
      `Dead links found:\n  ${picocolors.green(`"[..](./not-exist)"`)} ${picocolors.gray('/not-exist.html')}`,
    );
  });
});
