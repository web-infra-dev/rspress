import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';
import { compile } from '../processor';

describe('mdx', () => {
  it('basic', async () => {
    const result = await compile({
      source: `
![alt1](./test3.jpg)

<img src="./test4.png" alt="alt2" />
`,

      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });
});

describe('checkDeadImages', () => {
  let docDir: string;
  let origNodeEnv: string | undefined;

  beforeAll(() => {
    docDir = mkdtempSync(path.join(tmpdir(), 'rspress-test-'));
    mkdirSync(path.join(docDir, 'public'), { recursive: true });
    writeFileSync(path.join(docDir, 'existing.png'), '');
    writeFileSync(path.join(docDir, 'public', 'logo.png'), '');
    origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    process.env.NODE_ENV = origNodeEnv;
    rmSync(docDir, { recursive: true });
  });

  it('existing absolute image', async () => {
    const result = await compile({
      source: '![alt](/logo.png)',
      docDirectory: docDir,
      filepath: path.join(docDir, 'index.mdx'),
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toBeDefined();
  });

  it('missing absolute image', async () => {
    await expect(
      compile({
        source: '![alt](/missing.png)',
        docDirectory: docDir,
        filepath: path.join(docDir, 'index.mdx'),
        config: null,
        pluginDriver: null,
        routeService: null,
      }),
    ).rejects.toThrow('Dead image found');
  });

  it('existing relative image', async () => {
    const result = await compile({
      source: '![alt](./existing.png)',
      docDirectory: docDir,
      filepath: path.join(docDir, 'index.mdx'),
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toBeDefined();
  });

  it('missing relative image', async () => {
    await expect(
      compile({
        source: '![alt](./missing.png)',
        docDirectory: docDir,
        filepath: path.join(docDir, 'index.mdx'),
        config: null,
        pluginDriver: null,
        routeService: null,
      }),
    ).rejects.toThrow('Dead image found');
  });

  it('external image', async () => {
    const result = await compile({
      source: '![alt](https://example.com/image.png)',
      docDirectory: docDir,
      filepath: path.join(docDir, 'index.mdx'),
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toBeDefined();
  });
});
