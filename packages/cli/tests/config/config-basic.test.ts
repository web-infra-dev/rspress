import { describe, test, expect } from 'vitest';
import { loadConfigFile } from '../../src/config/loadConfigFile';
import path from 'node:path';
import { normalizePath } from '../../../core/src/node/utils/normalizePath';

const TEST_TITLE = 'my-title';

describe('Should load config file', () => {
  test('Load config.cjs', async () => {
    const fixtureDir = path.join(__dirname, 'cjs');
    const config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.cjs'),
    );

    expect(config).toMatchObject({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.mjs', async () => {
    const fixtureDir = path.join(__dirname, 'esm');
    const config = await loadConfigFile(
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
    let config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );

    expect(config).toMatchObject({
      root: fixtureDir,
      title: TEST_TITLE,
    });

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toMatchObject({
      root: normalizePath(fixtureDir),
      title: TEST_TITLE,
    });
  });

  test('Load config.js/config.ts in esm project', async () => {
    const fixtureDir = path.join(__dirname, 'esm');
    let config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );

    const expectConfig = {
      root: normalizePath(fixtureDir),
      title: TEST_TITLE,
    };
    expect(config).toMatchObject(expectConfig);

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toMatchObject(expectConfig);
  });
});
