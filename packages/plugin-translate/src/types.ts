import type { UserConfig } from '@rspress/shared';
import type { ClientOptions } from 'openai';

export interface MatchOptions {
  /**
   *The extension name of the filepath that will be translated
   * @default ['md','mdx']
   */
  extensions?: string[];
  /**
   * Include extra files from being translated
   */
  include?: string[];
  /**
   * Exclude files from being translated
   */
  exclude?: string[];
}

export interface PluginOptions {
  /**
   * The model config
   */
  // TODO 是否支持自定义模型调用 'GPT' | 'GLM'
  modelConfig: {
    clientOptions: ClientOptions;
    model?: string;
  };
  /**
   * The custom config of scanning for translation
   */
  match?: MatchOptions;
  /**
   * The rate limit per minute
   */
  rateLimitPerMinute?: number;
  /**
   * The customize the function to get prompt
   */
  getPrompt?: (content: string, from: string, to: string) => string;
}

export type TranslateGen = Required<PluginOptions> & {
  config: UserConfig;
  isProd: boolean;
};

export interface TranslationRequiredList {
  targetLangFullName: string;
  targetPath: string;
  originalPath: string;
  originalFileLangContent: string;
  prompt: string;
}
