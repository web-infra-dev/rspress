import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { normalizePath } from '../../../core/src/node/utils/normalizePath';
import { loadConfigFile } from '../../src/config/loadConfigFile';

const TEST_TITLE = 'my-title';

describe('Should load config file', () => {
  test('Load config.cjs', async () => {
    const fixtureDir = path.join(__dirname, 'cjs');
    const { config } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.cjs'),
    );

    expect(config).toMatchObject({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.mjs', async () => {
    const fixtureDir = path.join(__dirname, 'esm');
    const { config } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.mjs'),
    );

    expect(config).toMatchObject({
      // we need to normalize path as jiti will inject `__dirname` with posix separator in esm files
      root: normalizePath(fixtureDir),
      title: TEST_TITLE,
    });
  });

  test('Load config.js/config.ts in cjs project', async () => {
    const fixtureDir = path.join(__dirname, 'cjs');
    const { config } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );

    expect(config).toMatchObject({
      root: fixtureDir,
      title: TEST_TITLE,
    });

    const { config: config2 } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.ts'),
    );
    expect(config2).toMatchObject({
      root: normalizePath(fixtureDir),
      title: TEST_TITLE,
    });
  });

  test('Load config.js/config.ts in esm project', async () => {
    const fixtureDir = path.join(__dirname, 'esm');
    const { config } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );

    const expectConfig = {
      root: normalizePath(fixtureDir),
      title: TEST_TITLE,
    };
    expect(config).toMatchObject(expectConfig);

    const { config: config2 } = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.ts'),
    );
    expect(config2).toMatchObject(expectConfig);
  });
});
