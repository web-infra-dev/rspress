declare module 'virtual-routes' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-routes-ssr' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';

  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

declare module 'virtual-i18n-text';
