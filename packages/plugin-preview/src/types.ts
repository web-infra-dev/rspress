import type { RouteMeta } from '@rspress/shared';
import type { RsbuildConfig } from '@rsbuild/core';

export type Options = {
  /**
   * @deprecated Use previewMode instead.
   * true = 'iframe'
   * false = 'internal'
   */
  isMobile?: boolean;
  /**
   * @deprecated Use iframeOptions.position instead.
   */
  iframePosition?: 'fixed' | 'follow';
  /**
   * internal mode: component will be rendered inside the documentation, only support react.
   *
   * inframe mode: component will be rendered in iframe, note that aside will hide.
   * @default 'internal'
   */
  previewMode?: 'internal' | 'iframe';
  /**
   * enable when preview mode is iframe.
   */
  iframeOptions?: IframeOptions;
  /**
   * determine how to handle a internal code block without meta
   * @default 'preview'
   */
  defaultRenderMode?: 'pure' | 'preview';
  /**
   * Supported languages to be previewed
   */
  previewLanguages?: string[];
  /**
   * Transform previewed code in custom way
   */
  previewCodeTransform?: (codeInfo: {
    language: string;
    code: string;
  }) => string;
};

export type IframeOptions = {
  /**
   * framework in the iframe
   * @default 'react'
   */
  framework?: 'react' | 'solid';
  /**
   * position of the iframe
   * @default 'follow'
   */
  position?: 'fixed' | 'follow';
  /**
   * dev server port for the iframe
   * @default 7890
   */
  devPort?: number;
  builderConfig?: RsbuildConfig;
};

export type RemarkPluginOptions = Required<
  Pick<
    Options,
    | 'previewMode'
    | 'defaultRenderMode'
    | 'previewLanguages'
    | 'previewCodeTransform'
  >
> &
  Required<IframeOptions> & {
    getRouteMeta: () => RouteMeta[];
  };

// key: pageName
export type DemoInfo = Record<
  string,
  {
    id: string;
    path: string;
    title: string;
  }[]
>;

// copied from rsbuild, only need close function
export type StartServerResult = {
  urls: string[];
  port: number;
  server: {
    close: () => Promise<void>;
  };
};
