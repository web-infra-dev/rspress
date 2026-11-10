import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_TITLE = 'shiki-transformer:add-title';

// Match title=<value>, capturing either a quoted value (double/single/backtick)
// or a single unquoted token.
const TITLE_META_REGEX =
  /(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s]+))(?=\s|$)/;

function parseTitleFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  const matched = meta.match(TITLE_META_REGEX);
  return matched?.slice(1).find(Boolean) ?? '';
}

/**
 * @private compile-time only
 */
export function transformerAddTitle(): ShikiTransformer {
  return {
    name: SHIKI_TRANSFORMER_ADD_TITLE,
    pre(pre) {
      const title = parseTitleFromMeta(this.options.meta?.__raw);
      if (title.length > 0) {
        pre.properties = {
          ...pre.properties,
          title,
        };
      }
      return pre;
    },
  };
}
