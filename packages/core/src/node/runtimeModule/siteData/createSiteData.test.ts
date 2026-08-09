import type { UserConfig } from '@rspress/shared';
import { describe, expect, test } from '@rstest/core';
import { createSiteData } from './createSiteData';

describe('createSiteData', () => {
  test('preserves the default local search configuration', async () => {
    const { siteData } = await createSiteData({});

    expect(siteData.search).toEqual({
      mode: 'local',
      searchHooks: undefined,
    });
  });

  test('preserves disabled search in runtime site data', async () => {
    const { siteData } = await createSiteData({ search: false });

    expect(siteData.search).toBe(false);
  });

  test('removes search hooks without mutating user config', async () => {
    const search = {
      mode: 'local',
      searchHooks: '/absolute/search-hooks.ts',
    } satisfies NonNullable<UserConfig['search']>;

    const { siteData } = await createSiteData({ search });

    expect(siteData.search).toEqual({
      mode: 'local',
      searchHooks: undefined,
    });
    expect(search.searchHooks).toBe('/absolute/search-hooks.ts');
  });
});
