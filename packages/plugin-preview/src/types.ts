import type { RsbuildConfig } from '@rsbuild/core';
import type { RouteMeta } from '@rspress/core';

export type Options = {
  /**
   * determine how to handle a internal code block without meta like \`\`\`tsx
   * @default 'pure'
   */
  defaultRenderMode?: 'pure' | 'preview';
  /**
   * determine how to preview \`\`\`tsx preview code block
   * @default 'internal'
   */
  defaultPreviewMode?: 'internal' | 'iframe-fixed' | 'iframe-follow';
  /**
   * enable when preview mode is iframe.
   */
  iframeOptions?: IframeOptions;
  /**
   * Supported languages to be previewed
   * @default ['jsx', 'tsx']
   */
  previewLanguages?: string[];
  /**
   * Transform previewed code in custom way
   * @default ({ code }) => code
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
   * @deprecated
   */
  framework?: 'react';
  /**
   * dev server port for the iframe
   * @default 7890
   */
  devPort?: number;
  builderConfig?: RsbuildConfig;
  /**
   * custom support for other web frameworks
   */
  customEntry?: (meta: CustomEntry) => string;
};

export type PreviewRouteMeta = Pick<
  RouteMeta,
  'pageName' | 'routePath' | 'pureRoutePath' | 'lang' | 'version'
>;

export interface CustomEntryDemo {
  id: string;
  demoPath: string;
  /** Absolute path of an external `file` code block. */
  sourcePath?: string;
  title: string;
}

interface CustomFollowEntry {
  previewMode: 'iframe-follow';
  demoPath: string;
  demos: [CustomEntryDemo];
  route: PreviewRouteMeta;
}

interface CustomFixedEntry {
  previewMode: 'iframe-fixed';
  /**
   * The default framework-specific aggregate module. Custom fixed entries
   * should normally import modules from `demos` instead.
   */
  demoPath: string;
  demos: CustomEntryDemo[];
  route: PreviewRouteMeta;
}

export type CustomEntry = CustomFollowEntry | CustomFixedEntry;

export type RemarkPluginOptions = Required<
  Pick<
    Options,
    | 'defaultPreviewMode'
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
    sourcePath?: string;
    title: string;
    previewMode: 'iframe-fixed' | 'iframe-follow';
    route: PreviewRouteMeta;
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
