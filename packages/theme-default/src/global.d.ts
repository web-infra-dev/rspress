declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';

  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '@theme-assets/*' {
  const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | string;
  export default SvgIcon;
}

declare module '*.svg' {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare module 'virtual-routes' {
  export { Route } from 'node/route/RouteService';

  export const routes: Route[];
}

declare module 'virtual-search-hooks' {
  import type {
    BeforeSearch,
    OnSearch,
    AfterSearch,
    RenderSearchFunction,
  } from '#theme/components/Search/logic/types';

  export const beforeSearch: BeforeSearch;
  export const onSearch: OnSearch;
  export const afterSearch: AfterSearch;
  export const render: RenderSearchFunction;
}

declare module 'virtual-prism-languages' {
  export const aliases: Record<string, string[]>;
  export const languages: Record<string, unknown>;
}

declare module 'virtual-search-index-hash' {
  const hash: string;
  export default hash;
}

declare const __webpack_public_path__: string;

declare module '@theme';
