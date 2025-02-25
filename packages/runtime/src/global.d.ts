declare module '__VIRTUAL_ROUTES__' {
  import { Route } from '@rspress/shared';
  export const routes: Route[];
}

declare module 'virtual-routes' {
  import { Route } from '@rspress/shared';
  export const routes: Route[];
}

declare module 'virtual-routes-ssr' {
  import { Route } from '@rspress/shared';
  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';
  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

declare module 'virtual-i18n-text';
