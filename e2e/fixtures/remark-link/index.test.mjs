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
const registerRouteAnchors = (filepath, anchorIds) => {
  routeService.setRouteAnchorIds(filepath, new Set(anchorIds));
};

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

  test('should report dead anchors via remark message', async () => {
    const filepath = path.resolve(import.meta.dirname, 'doc/anchor.md');
    registerRouteAnchors(path.resolve(import.meta.dirname, 'doc/target.md'), [
      'target',
      'target-heading',
      'custom-heading',
    ]);

    const { messages } = await remark()
      .use(checkDeadLinks)
      .process({ path: filepath, value: await fs.readFile(filepath) });
    expect(messages).toHaveLength(1);
    expect(messages[0].reason).toBe(
      `Dead anchors found:\n  ${picocolors.green(`"[..](./target#missing)"`)} ${picocolors.gray('/target.html#missing')}`,
    );
  });

  test('should support disabling anchor checks', async () => {
    const filepath = path.resolve(import.meta.dirname, 'doc/anchor.md');
    const checkDeadLinksWithoutAnchors = lintRule(
      'check-dead-links-without-anchors',
      async (tree, file) => {
        remarkLink({
          cleanUrls: false,
          routeService,
          remarkLinkOptions: {
            checkDeadLinks: config.markdown.link.checkDeadLinks,
            checkAnchors: false,
          },
          lint: true,
        })(tree, file);
      },
    );
    const { messages } = await remark()
      .use(checkDeadLinksWithoutAnchors)
      .process({ path: filepath, value: await fs.readFile(filepath) });
    expect(messages).toHaveLength(0);
  });

  test('should disable anchor checks by default', async () => {
    const filepath = path.resolve(import.meta.dirname, 'doc/anchor.md');
    const checkDeadLinksWithoutAnchorOption = lintRule(
      'check-dead-links-without-anchor-option',
      async (tree, file) => {
        remarkLink({
          cleanUrls: false,
          routeService,
          remarkLinkOptions: {
            checkDeadLinks: config.markdown.link.checkDeadLinks,
          },
          lint: true,
        })(tree, file);
      },
    );
    const { messages } = await remark()
      .use(checkDeadLinksWithoutAnchorOption)
      .process({ path: filepath, value: await fs.readFile(filepath) });
    expect(messages).toHaveLength(0);
  });
});
