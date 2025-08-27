import type { RspressPlugin } from '@rspress/core';
import { transformerTwoslash } from '@shikijs/twoslash';

/**
 * Plugin to applies Twoslash transformations to code blocks.
 */
export function pluginTwoslash(): RspressPlugin {
  return {
    name: '@rspress/plugin-twoslash',
    config(config) {
      config.markdown ??= {};
      config.markdown.shiki ??= {};
      config.markdown.shiki.transformers ??= [];
      config.markdown.shiki.transformers.push(transformerTwoslash());
      return config;
    },
  };
}
