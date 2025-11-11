import type { ShikiTransformer } from 'shiki';

export interface ITransformerLineNumberOptions {
  classActivePre?: string;
  classActiveLine?: string;
  /**
   * Default value for showing line numbers
   * @default false
   */
  defaultShowLineNumbers?: boolean;
}

export const SHIKI_TRANSFORMER_LINE_NUMBER = 'shiki-transformer:line-number';

/**
 * Check if the meta string contains the lineNumbers keyword
 */
function hasLineNumbersInMeta(meta: string | undefined): boolean | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  return kvList.includes('lineNumbers');
}

export function transformerLineNumber(
  options: ITransformerLineNumberOptions = {},
): ShikiTransformer {
  const {
    classActiveLine = 'line-number',
    classActivePre = 'has-line-number',
    defaultShowLineNumbers = false,
  } = options;

  return {
    name: SHIKI_TRANSFORMER_LINE_NUMBER,
    pre(pre) {
      // Check meta attribute first, then fall back to default config
      const metaHasLineNumbers = hasLineNumbersInMeta(this.options.meta?.__raw);
      const shouldShowLineNumbers =
        metaHasLineNumbers ?? defaultShowLineNumbers;

      if (shouldShowLineNumbers) {
        return this.addClassToHast(pre, classActivePre);
      }
      return pre;
    },
    line(node) {
      // Check meta attribute first, then fall back to default config
      const metaHasLineNumbers = hasLineNumbersInMeta(this.options.meta?.__raw);
      const shouldShowLineNumbers =
        metaHasLineNumbers ?? defaultShowLineNumbers;

      if (shouldShowLineNumbers) {
        this.addClassToHast(node, classActiveLine);
      }
    },
  };
}
