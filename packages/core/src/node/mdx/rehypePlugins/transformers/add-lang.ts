import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_LANG = 'shiki-transformer:add-lang';

/**
 * @private compile-time only
 */
export function transformerAddLang(): ShikiTransformer {
  return {
    name: SHIKI_TRANSFORMER_ADD_LANG,
    pre(pre) {
      const lang = this.options.lang;
      if (lang.length > 0) {
        pre.properties = {
          ...pre.properties,
          lang,
        };
      }
      return pre;
    },
  };
}
