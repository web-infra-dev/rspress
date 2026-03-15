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

declare module 'react-server-dom-rspack/client.browser' {
  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
  ): Promise<T>;
}

declare module 'react-server-dom-rspack/client.node' {
  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
  ): Promise<T>;
}

declare module 'react-server-dom-rspack/client.edge' {
  export function createFromReadableStream<T>(
    stream: ReadableStream<Uint8Array>,
  ): Promise<T>;
}

declare module 'react-server-dom-rspack/server.node' {
  import type { ComponentType } from 'react';

  export type ServerEntry<T extends ComponentType<any>> = T & {
    entryCssFiles?: string[];
    entryJsFiles?: string[];
  };

  export function renderToReadableStream(
    value: unknown,
  ): ReadableStream<Uint8Array>;
}

declare module 'react-server-dom-rspack/server.edge' {
  import type { ComponentType } from 'react';

  export type ServerEntry<T extends ComponentType<any>> = T & {
    entryCssFiles?: string[];
    entryJsFiles?: string[];
  };

  export function renderToReadableStream(
    value: unknown,
  ): ReadableStream<Uint8Array>;
}
