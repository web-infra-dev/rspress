import type { RspressPlugin } from '@rspress/shared';

import { translate } from './translate';
import { defaultPrompt } from './constants';
import { PluginOptions } from './types';

export function pluginTranslate(options: PluginOptions): RspressPlugin {
  const {
    modelConfig,
    match = {},
    getPrompt = defaultPrompt,
    rateLimitPerMinute = 3,
  } = options;
  return {
    name: '@rspress/plugin-translate',
    async afterBuild(config, isProd) {
      if (isProd) {
        return;
      }
      translate({
        modelConfig,
        match,
        getPrompt,
        rateLimitPerMinute,
        config,
        isProd,
      });
    },
    async beforeBuild(config, isProd) {
      if (!isProd) {
        return;
      }
      await translate({
        modelConfig,
        match,
        getPrompt,
        rateLimitPerMinute,
        config,
        isProd,
      });
    },
  };
}
