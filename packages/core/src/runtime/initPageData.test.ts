import { describe, expect, it, rs } from '@rstest/core';
import { siteData } from './hooks/useSite';
import { initPageData } from './initPageData';

rs.mock('./hooks/useSite', () => ({
  siteData: {
    lang: '',
    locales: [],
    multiVersion: { default: 'v1', versions: ['v1', 'v2'] },
  },
}));
rs.mock('./hooks/usePages', () => ({ pageData: { pages: [] } }));
rs.mock('./route', () => ({ pathnameToRouteService: () => undefined }));

describe('missing page context', () => {
  it('detects the target version even when lang is empty', async () => {
    expect(await initPageData('/v2/missing')).toMatchObject({
      pageType: '404',
      version: 'v2',
      lang: '',
    });
    expect(await initPageData('/missing')).toMatchObject({ version: 'v1' });
  });

  it('derives both version and language from the target path', async () => {
    siteData.lang = 'en';
    siteData.locales = [
      { lang: 'en', label: 'English' },
      { lang: 'zh', label: '中文' },
    ];
    try {
      expect(await initPageData('/v2/zh/missing')).toMatchObject({
        pageType: '404',
        version: 'v2',
        lang: 'zh',
      });
    } finally {
      siteData.lang = '';
      siteData.locales = [];
    }
  });
});
