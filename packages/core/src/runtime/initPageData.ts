import { isEqualPath, pathnameToRouteService } from '@rspress/runtime';
import {
  type BaseRuntimePageInfo,
  type FrontMatterMeta,
  type Header,
  MDX_OR_MD_REGEXP,
  type PageData,
  cleanUrl,
} from '@rspress/shared';
import { base } from 'virtual-runtime-config';
import siteData from 'virtual-site-data';

type PageMeta = {
  title: string;
  headingTitle: string;
  toc: Header[];
  frontmatter: FrontMatterMeta;
};

export async function initPageData(routePath: string): Promise<PageData> {
  const matchedRoute = pathnameToRouteService(routePath);
  if (matchedRoute) {
    // Preload route component
    const mod = await matchedRoute.preload();
    const pagePath = cleanUrl(matchedRoute.filePath);
    const normalize = (p: string) =>
      // compat the path that has no / suffix and ignore case
      p
        .replace(/\/$/, '')
        .toLowerCase();
    const extractPageInfo: BaseRuntimePageInfo = siteData.pages.find(page =>
      isEqualPath(normalize(page.routePath), normalize(matchedRoute.path)),
    )!;

    // FIXME: when sidebar item is configured as link string, the sidebar text won't updated when page title changed
    // Reason: The sidebar item text depends on pageData, which is not updated when page title changed, because the pageData is computed once when build
    const encodedPagePath = encodeURIComponent(pagePath);
    const meta: PageMeta =
      (
        mod.default as unknown as {
          __RSPRESS_PAGE_META: Record<string, PageMeta>;
        }
      ).__RSPRESS_PAGE_META?.[encodedPagePath] || ({} as PageMeta);
    // mdx loader will generate __RSPRESS_PAGE_META,
    // if the filePath don't match it, we can get meta from j(t)sx if we customize it
    const {
      toc = [],
      title = '',
      frontmatter = {},
      ...rest
    } = MDX_OR_MD_REGEXP.test(matchedRoute.filePath)
      ? meta
      : (mod as unknown as PageMeta);
    return {
      siteData,
      page: {
        ...rest,
        pagePath,
        ...extractPageInfo,
        pageType: frontmatter?.pageType || 'doc',
        title,
        frontmatter,
        toc,
      },
    } satisfies PageData;
  }

  let lang = siteData.lang || '';
  let version = siteData.multiVersion?.default || '';

  if (siteData.lang && typeof window !== 'undefined') {
    const path = location.pathname.replace(base, '').split('/').slice(0, 2);

    if (siteData.locales.length) {
      const result = siteData.locales.find(({ lang }) => path.includes(lang));

      if (result) {
        lang = result.lang;
      }
    }

    if (siteData.multiVersion.versions) {
      const result = siteData.multiVersion.versions.find(version =>
        path.includes(version),
      );

      if (result) {
        version = result;
      }
    }
  }

  // 404 Page
  return {
    siteData,
    page: {
      pagePath: '',
      pageType: '404',
      routePath: '/404',
      lang,
      frontmatter: {},
      title: '404',
      toc: [],
      version,
      _filepath: '',
      _relativePath: '',
    },
  };
}
