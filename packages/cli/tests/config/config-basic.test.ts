import { describe, test, expect } from 'vitest';
import { loadConfigFile } from '../../src/config/loadConfigFile';
import path from 'path';
import { normalizePath } from '../../../core/src/node/utils/normalizePath';

const TEST_TITLE = 'my-title';

describe('Should load config file', () => {
  test('Load config.cjs', async () => {
    const fixtureDir = path.join(__dirname, 'cjs');
    const config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.cjs'),
    );

    expect(config).toContain({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.mjs', async () => {
    const fixtureDir = path.join(__dirname, 'esm');
    const config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.mjs'),
    );

    expect(config).toContain({
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

    expect(config).toContain({
      root: fixtureDir,
      title: TEST_TITLE,
    });

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toContain({
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
    expect(config).toContain(expectConfig);

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toContain(expectConfig);
  });
});
