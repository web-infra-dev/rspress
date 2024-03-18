declare module 'virtual-routes' {
  export { Route } from '@rspress/shared';

  export const routes: Route[];
}

declare module 'virtual-routes-ssr' {
  export { Route } from '@rspress/shared';

  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';

  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

declare module 'virtual-search-index-hash' {
  const hash: string;
  export default hash;
}

declare module 'virtual-global-components' {
  import { ComponentType } from 'react';

  const components: (ComponentType | [ComponentType, any])[];
  export default components;
}

declare module 'virtual-global-styles';

declare module 'virtual-i18n-text';

declare module 'virtual-search-hooks' {
  export const onSearch: (query: string) => void | Promise<void>;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '@theme' {
  export * from '@rspress/theme-default';
}
