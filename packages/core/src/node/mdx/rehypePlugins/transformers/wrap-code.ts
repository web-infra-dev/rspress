import type { ShikiTransformer } from 'shiki';

export interface ITransformerWrapCodeOptions {
  classActivePre?: string;
  /**
   * Default value for wrapping code
   * @default false
   */
  defaultWrapCode?: boolean;
}

export const SHIKI_TRANSFORMER_WRAP_CODE = 'shiki-transformer:wrap-code';

/**
 * Check if the meta string contains the wrapCode keyword
 */
function hasWrapCodeInMeta(meta: string | undefined): boolean | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  return kvList.includes('wrapCode');
}

export function transformerWrapCode(
  options: ITransformerWrapCodeOptions = {},
): ShikiTransformer {
  const { classActivePre = 'has-wrap-code', defaultWrapCode = false } = options;

  return {
    name: SHIKI_TRANSFORMER_WRAP_CODE,
    pre(pre) {
      // Check meta attribute first, then fall back to default config
      const metaHasWrapCode = hasWrapCodeInMeta(this.options.meta?.__raw);
      const shouldWrapCode = metaHasWrapCode ?? defaultWrapCode;

      if (shouldWrapCode) {
        pre.properties = {
          ...pre.properties,
          wrapCode: true,
        };
        return this.addClassToHast(pre, classActivePre);
      }
      return pre;
    },
  };
}
