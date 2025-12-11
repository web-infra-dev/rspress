declare module 'virtual-site-data' {
  import { SiteData, DefaultThemeConfig } from '@rspress/core';

  const data: SiteData;
  export default data;
}

declare module '*.module.scss';
declare module '*.scss';
declare module '*.css';

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
  } from '@theme';

  export const beforeSearch: BeforeSearch;
  export const onSearch: OnSearch;
  export const afterSearch: AfterSearch;
  export const render: RenderSearchFunction;
}

declare module 'virtual-social-links' {
  export default Record<string, string>;
}

declare const __WEBPACK_PUBLIC_PATH__: string;

declare module 'virtual-runtime-config' {
  import type { NormalizedRuntimeConfig } from '@rspress/core';

  export const base: NormalizedRuntimeConfig['base'];
}

declare module 'virtual-page-data' {
  import { PageData } from '@rspress/core';
  const searchIndexHash: Record<string, string>;
  const pageData: PageData;
  export { pageData, searchIndexHash };
}

declare module '@theme' {
  export * from '#theme';
}