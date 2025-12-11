declare module 'virtual-routes' {
  import { Route } from '@rspress/shared';
  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';
  const data: SiteData;
  export default data;
}

declare module 'virtual-page-data' {
  import { PageData } from '@rspress/shared';
  const searchIndexHash: Record<string, string>;
  const pageData: PageData;
  export { pageData, searchIndexHash };
}

declare module 'virtual-i18n-text';
