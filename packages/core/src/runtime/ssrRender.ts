import type { RouteMeta, UserConfig } from '@rspress/shared';
import type { Unhead } from '@unhead/react/server';

export interface SSRRenderOptions {
  htmlTemplate?: string;
  route?: RouteMeta;
}

export interface SSRRenderResult {
  appHtml: string;
}

export type SSRRender = (
  pagePath: string,
  head: Unhead,
  configHead?: UserConfig['head'],
  options?: SSRRenderOptions,
) => Promise<SSRRenderResult>;
