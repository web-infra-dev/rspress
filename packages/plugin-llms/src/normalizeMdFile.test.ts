import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RouteService } from '@rspress/core';
import { type ArgumentsType, describe, expect, it } from 'vitest';
import { renderToMd } from '/Users/appe/Documents/codes/remark-mdx-to-md/src/react/render';
import { normalizeMdFile } from './normalizeMdFile';
import { remarkMdxToMd } from './remarkMdxToMd';

describe('normalizeMdFile', () => {
  it('compiles docs-basic fixture to markdown', async () => {
    const docsRoot = path.join(__dirname, 'fixtures/docs-basic');
    const filePath = path.join(docsRoot, 'index.mdx');
    const content = await readFile(filePath, 'utf-8');

    const routeService = await RouteService.create({
      config: {
        route: {
          extensions: ['.mdx', '.md'],
        },
        lang: 'en',
      },
      externalPages: [],
      scanDir: docsRoot,
    });

    const result = await normalizeMdFile(
      content,
      filePath,
      routeService,
      '/',
      false,
      false,
      [],
    );

    expect(result).toMatchSnapshot();
  });

  it('compiles mdx-to-md', async () => {
    const docsRoot = path.join(__dirname, 'fixtures/docs-basic');
    const filePath = path.join(docsRoot, 'index.mdx');
    const content = await readFile(filePath, 'utf-8');

    const routeService = await RouteService.create({
      config: {
        route: {
          extensions: ['.mdx', '.md'],
        },
        lang: 'en',
      },
      externalPages: [],
      scanDir: docsRoot,
    });

    const result = await normalizeMdFile(
      content,
      filePath,
      routeService,
      '/',
      false,
      false,
      [
        [
          remarkMdxToMd,
          {
            onVirtualFile({ runtime }) {
              console.log(renderToMd(runtime), 333333333);
            },
          } as ArgumentsType<typeof remarkMdxToMd>[0],
        ],
      ],
    );

    expect(result).toMatchSnapshot();
  });
});
