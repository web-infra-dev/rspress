declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/shared';

  const data: SiteData<DefaultThemeConfig>;
  export default data;
}

// for the first build when generating the module.scss.d.ts
declare module '*.module.scss';
declare module '@theme-assets/*' {
  const SvgIcon: React.FC<React.SVGProps<SVGSVGElement>> | string;
  export default SvgIcon;
}

declare module '*.svg' {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
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
  const hash: Record<string, string>;
  export default hash;
}

declare const __WEBPACK_PUBLIC_PATH__: string;

declare module '@theme';
