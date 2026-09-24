declare module 'virtual-routes' {
  import type { Route } from '@rspress/shared';

  export const routes: Route[];
}

declare module 'virtual-site-data' {
  import type { SiteData } from '@rspress/shared';

  const data: SiteData;
  export default data;
}

declare module 'virtual-page-data' {
  import type { PageData } from '@rspress/shared';
  const searchIndexHash: Record<string, string>;
  const pageData: PageData;
  export { pageData, searchIndexHash };
}

declare module 'virtual-global-components' {
  import type { ComponentType } from 'react';

  const components: (ComponentType | [ComponentType, object])[];
  export default components;
}

declare module 'virtual-global-styles';

declare module 'virtual-i18n-text' {
  const text: Record<string, Record<string, string>>;
  export default text;
}

declare module 'virtual-search-hooks' {
  import type {
    BeforeSearch,
    OnSearch,
    AfterSearch,
    RenderSearchFunction,
  } from '@rspress/core/theme';
  export const beforeSearch: BeforeSearch | undefined;
  export const onSearch: OnSearch | undefined;
  export const afterSearch: AfterSearch | undefined;
  export const render: RenderSearchFunction | undefined;
}

declare module 'virtual-social-links' {
  const icons: Record<string, string>;
  export default icons;
}
