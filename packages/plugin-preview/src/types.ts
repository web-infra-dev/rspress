import { type RouteMeta } from '@rspress/shared';

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
};

type IframeOptions = {
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
   * @default 'follow'
   */
  devPort?: number;
};

export type RemarkPluginOptions = Required<
  Pick<Options, 'previewMode' | 'defaultRenderMode'>
> &
  Required<IframeOptions> & {
    getInfo: () => Info;
  };

type Info = {
  isProd: boolean;
  routeMeta: RouteMeta[];
};
