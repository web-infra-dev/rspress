import type { ShikiTransformer } from 'shiki';

export interface ITransformerLineNumberOptions {
  /**
   * Default value for showing line numbers
   * @default false
   */
  defaultShowLineNumbers?: boolean;
}

export const SHIKI_TRANSFORMER_ADD_LINE_NUMBERS =
  'shiki-transformer:add-line-numbers';

/**
 * Check if the meta string contains the lineNumbers keyword
 */
function hasLineNumbersInMeta(meta: string | undefined): boolean | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  return kvList.includes('lineNumbers') || undefined;
}

/**
 * @private compile-time only
 */
export function transformerAddLineNumbers(
  options: ITransformerLineNumberOptions = {},
): ShikiTransformer {
  const { defaultShowLineNumbers = false } = options;

  return {
    name: SHIKI_TRANSFORMER_ADD_LINE_NUMBERS,
    pre(pre) {
      // Check meta attribute first, then fall back to default config
      const metaHasLineNumbers = hasLineNumbersInMeta(this.options.meta?.__raw);
      const shouldShowLineNumbers =
        metaHasLineNumbers ?? defaultShowLineNumbers;

      if (shouldShowLineNumbers) {
        pre.properties = {
          ...pre.properties,
          lineNumbers: shouldShowLineNumbers,
        };
      }

      return pre;
    },
  };
}
