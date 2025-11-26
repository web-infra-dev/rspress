declare module 'virtual-routes' {
  export { Route } from '@rspress/shared';

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


declare module 'virtual-global-components' {
  import { ComponentType } from 'react';

  const components: (ComponentType | [ComponentType, object])[];
  export default components;
}

declare module 'virtual-global-styles';

declare module 'virtual-i18n-text';

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module '@theme' {
  export * from '#theme';
}
