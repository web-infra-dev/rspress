import { describe, expect, it, rs } from '@rstest/core';
import type { PageIndexInfo } from '@rspress/shared';
import { LocalProvider } from './LocalProvider';
import type { SearchOptions } from '../types';

rs.mock('virtual-page-data', () => {
  return { searchIndexHash: { '###en': 'test-hash' } };
});

/** A token far longer than anything a person would search for. */
const OVERSIZED_TOKEN =
  'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5'.repeat(8);

/**
 * A run of CJK characters with no punctuation. `\p{L}` covers these, so it
 * matches a length limit the same way a base64 blob does — but it must stay
 * searchable.
 */
const LONG_CJK_RUN =
  '连接器负责把外部系统的凭据同步到集群中并在凭据过期之前自动刷新它们同时保证租户之间的隔离与最小权限原则的落实以及审计记录的完整可追溯';

const page = (overrides: Partial<PageIndexInfo>): PageIndexInfo =>
  ({
    title: 'Page',
    content: '',
    routePath: '/page',
    lang: 'en',
    version: '',
    toc: [],
    frontmatter: {},
    ...overrides,
  }) as PageIndexInfo;

const PAGES: PageIndexInfo[] = [
  page({
    routePath: '/with-blob',
    title: 'Install the connector',
    content: `tekton.dev/icon: data:image/svg+xml;base64,${OVERSIZED_TOKEN}`,
  }),
  page({
    routePath: '/chinese',
    title: '连接器说明',
    content: LONG_CJK_RUN,
  }),
];

const searchOptions = {
  currentLang: 'en',
  currentVersion: '',
  versioned: false,
} as SearchOptions;

const createProvider = async () => {
  const globalObject = globalThis as unknown as Record<string, unknown>;
  globalObject.__WEBPACK_PUBLIC_PATH__ = '/';
  globalObject.fetch = (() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(PAGES),
    })) as unknown as typeof fetch;

  const provider = new LocalProvider();
  await provider.init(searchOptions);
  return provider;
};

const routePathsFor = async (provider: LocalProvider, keyword: string) => {
  const [result] = await provider.search({ keyword, limit: 10 });
  return result.hits.map(hit => hit.routePath);
};

describe('LocalProvider oversized tokens', () => {
  it('does not index a token longer than the limit', async () => {
    const provider = await createProvider();

    // A slice from the middle of the blob. With `tokenize: 'full'` and no
    // length limit this would match, at the cost of indexing every substring
    // of a multi-kilobyte token.
    const slice = OVERSIZED_TOKEN.slice(100, 120).toLowerCase();

    expect(await routePathsFor(provider, slice)).toEqual([]);
  });

  it('still indexes ordinary words on the same page', async () => {
    const provider = await createProvider();

    expect(await routePathsFor(provider, 'connector')).toContain('/with-blob');
  });

  it('still indexes short tokens inside the same code sample', async () => {
    const provider = await createProvider();

    expect(await routePathsFor(provider, 'tekton')).toContain('/with-blob');
  });

  it('keeps a long CJK run without punctuation searchable', async () => {
    const provider = await createProvider();

    // The CJK index splits this per character in `finalize`, which runs *after*
    // the length check — so the limit must not be applied to that index.
    expect(await routePathsFor(provider, '凭据')).toContain('/chinese');
  });
});
