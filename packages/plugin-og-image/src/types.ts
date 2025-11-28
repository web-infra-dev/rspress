import type { PageIndexInfo } from '@rspress/core';

/**
 * OG image template data
 */
export interface OgImageTemplateData {
  /**
   * Page title
   */
  title: string;
  /**
   * Page description
   */
  description?: string;
  /**
   * Site name
   */
  siteName?: string;
  /**
   * Site logo URL or path
   */
  logo?: string;
  /**
   * Custom background color
   */
  backgroundColor?: string;
  /**
   * Custom text color
   */
  textColor?: string;
}

/**
 * OG image generation options
 */
export interface OgImageOptions {
  /**
   * Width of the generated image in pixels
   * @default 1200
   */
  width?: number;
  /**
   * Height of the generated image in pixels
   * @default 630
   */
  height?: number;
  /**
   * Custom template function to generate the SVG/JSX template
   */
  template?: (data: OgImageTemplateData) => string | Promise<string>;
  /**
   * Filter function to determine which pages should have OG images generated
   * @default () => true (all pages)
   */
  filter?: (pageData: PageIndexInfo) => boolean;
}

/**
 * Plugin options for pluginOgImage
 */
export interface PluginOgImageOptions {
  /**
   * Site URL (required for generating absolute URLs)
   */
  siteUrl: string;
  /**
   * OG image generation options
   */
  ogImage?: OgImageOptions;
}
