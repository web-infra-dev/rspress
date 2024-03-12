import { describe, test, expect } from 'vitest';
import { loadConfigFile } from '../../src/config/loadConfigFile';
import path from 'path';

const TEST_TITLE = 'my-title';

describe('Should load config file', () => {
  test('Load config.cjs', async () => {
    const fixtureDir = path.join(__dirname, './cjs');
    const config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.cjs'),
    );
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.mjs', async () => {
    const fixtureDir = path.join(__dirname, './esm');
    const config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.mjs'),
    );
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.js/config.ts in cjs project', async () => {
    const fixtureDir = path.join(__dirname, './cjs');
    let config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });

  test('Load config.js/config.ts in esm project', async () => {
    const fixtureDir = path.join(__dirname, './esm');
    let config = await loadConfigFile(
      path.join(fixtureDir, 'rspress.config.js'),
    );
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });

    config = await loadConfigFile(path.join(fixtureDir, 'rspress.config.ts'));
    expect(config).toEqual({
      root: fixtureDir,
      title: TEST_TITLE,
    });
  });
});
