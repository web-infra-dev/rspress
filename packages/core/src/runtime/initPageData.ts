import {
  type BaseRuntimePageInfo,
  cleanUrl,
  type FrontMatterMeta,
  type Header,
  MDX_OR_MD_REGEXP,
  type PageDataLegacy,
} from '@rspress/shared';
import { pageData } from 'virtual-page-data';
import siteData from 'virtual-site-data';
import { pathnameToRouteService } from './route';
import { isEqualPath } from './utils';

type PageMeta = {
  title: string;
  headingTitle: string;
  toc: Header[];
  frontmatter: FrontMatterMeta;
};

export type Page = PageDataLegacy['page'];

type CacheSlot = { routePath: string; data: Page } | undefined;

// Fixed 3-slot cache for navigation page data. Only slot 0 is explicitly warmed (by useLinkNavigate before calling
// navigate()). Slot 2 is populated implicitly when the forward shift moves the old current page (slot 1) down. This
// means back navigation gets a cache hit for free without any explicit warming the previous page's data is already in
// slot 2 from the last forward navigation.
//
// Example flow:
//   1. User is on page A.             Slots: [undefined, A, undefined]
//   2. User clicks link to B.
//      useLinkNavigate warms slot 0.  Slots: [B, A, undefined]
//   3. consumeCachedPageData(B) fires.
//      Slot 0 matches -> forward shift. Slots: [undefined, B, A]
//   4. User presses browser back.
//      consumeCachedPageData(A) fires.
//      Slot 0 empty, slot 2 matches
//      -> backward shift.              Slots: [B, A, undefined]
//      A's data returned synchronously, no flash.
//
// Cache misses (e.g. back 2+ pages) fall through to async initPageData, which is cheap since the browser's module cache
// retains loaded chunks.
//
//   [0] = next page (warmed by link click before navigate())
//   [1] = current page
//   [2] = previous page
const slots: [CacheSlot, CacheSlot, CacheSlot] = [
  undefined,
  undefined,
  undefined,
];

// Warm slot 0 with the target page's data before navigation.
export function warmPageData(routePath: string, data: Page): void {
  // Trample whatever the current "next" page will be in our cache.
  slots[0] = { routePath, data };
}

// Check the cache on route change. Direction is implicit: a slot 0 match means forward navigation (the page was
// explicitly warmed by useLinkNavigate), a slot 2 match means backward navigation (the page was retained from a prior
// forward shift). On match, slots are shifted to reflect the new navigation position.
export function consumeCachedPageData(routePath: string): Page | undefined {
  if (slots[0]?.routePath === routePath) {
    // Forward navigation: next becomes current, current becomes previous
    const data = slots[0].data;
    slots[2] = slots[1];
    slots[1] = slots[0];
    slots[0] = undefined;
    return data;
  }
  if (slots[2]?.routePath === routePath) {
    // Backward navigation: previous becomes current, current becomes next
    const data = slots[2].data;
    slots[0] = slots[1];
    slots[1] = slots[2];
    slots[2] = undefined;
    return data;
  }
  // Anything besides that is a cache miss, which would follow the async code path that existed before this code was
  // introduced.
  return undefined;
}

// Set slot 1 directly on cache miss or SSR hydration. Shifts the old current page to slot 2 (previous). Leaves slot 0
// alone it may be warming an unrelated page.
export function setCurrentPageData(routePath: string, data: Page): void {
  slots[2] = slots[1];
  slots[1] = { routePath, data };
}

export async function initPageData(routePath: string): Promise<Page> {
  const matchedRoute = pathnameToRouteService(routePath);
  if (matchedRoute) {
    // Preload route component
    const mod = await matchedRoute.preload();
    const pagePath = cleanUrl(matchedRoute.filePath);
    const normalize = (p: string) =>
      // compat the path that has no / suffix and ignore case
      p.replace(/\/$/, '').toLowerCase();
    const extractPageInfo: BaseRuntimePageInfo = pageData.pages.find(page =>
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
      ...rest,
      pagePath,
      ...extractPageInfo,
      pageType: frontmatter?.pageType || 'doc',
      title,
      frontmatter,
      toc,
    };
  }

  let lang = siteData.lang || '';
  let version = siteData.multiVersion?.default || '';

  if (siteData.lang && typeof window !== 'undefined') {
    const path = window.location.pathname
      .replace(siteData.base, '')
      .split('/')
      .slice(0, 2);

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
  };
}
