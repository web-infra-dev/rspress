import type { RspressPlugin } from '@rspress/core';

/**
 * Plugin to applies Twoslash transformations to code blocks.
 */
export function pluginTwoslash(): RspressPlugin {
  return {
    name: '@rspress/plugin-twoslash',
  };
}
