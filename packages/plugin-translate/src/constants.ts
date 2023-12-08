export const DEFAULT_NEED_TRANSLATE_EXTENSIONS = ['md', 'mdx'];
export const DEFAULT_GPT_MODEL = 'gpt-3.5-turbo';
export const RSPRESS_CACHE_DIR = '.rspress-plugin-translate-cache';

export const defaultPrompt = (
  content: string,
  from: string,
  to: string,
) => `A ${from} markdown file content is provided: ${content}
The masterful ${from} translator flawlessly translates the phrase into ${to} and keep the markdown formatting:`;
