import type { UserConfig } from '@rspress/shared';
import type { ClientOptions } from 'openai';

export interface MatchOptions {
  /**
   *The extension name of the filepath that will be translated
   * @default ['md','mdx']
   */
  extensions?: string[];
  /**
   * Exclude files from being translated
   */
  exclude?: string[];
}

export interface PluginOptions {
  /**
   * The model config
   */
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
