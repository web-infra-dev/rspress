import path from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { getPageIndexInfoByRoute } from '../route/extractPageData';

const fixtureDir = path.join(__dirname, '../route/fixtures/cjk');
const route = {
  absolutePath: path.join(fixtureDir, 'index.mdx'),
  lang: '',
  pageName: 'index',
  relativePath: 'index.mdx',
  routePath: '/',
  version: '',
};

const baseOptions = {
  alias: {},
  replaceRules: [],
  root: fixtureDir,
  searchCodeBlocks: false,
  routeService: null,
  config: {},
};

describe('cjk friendly emphasis', () => {
  it('enables CJK-friendly emphasis by default', async () => {
    const page = await getPageIndexInfoByRoute(route, baseOptions);
    expect(page._html).toContain('<strong>');
  });

  it('respects opt-out config', async () => {
    const page = await getPageIndexInfoByRoute(route, {
      ...baseOptions,
      cjkFriendlyEmphasis: false,
    });
    expect(page._html).toContain(
      '**このアスタリスクは強調記号として認識されず、そのまま表示されます。**',
    );
  });
});
