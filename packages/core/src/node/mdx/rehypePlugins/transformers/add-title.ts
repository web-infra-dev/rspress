import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_TITLE = 'shiki-transformer:add-title';

function parseTitleFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  let result = meta;
  const highlightReg = /{[\d,-]*}/i;
  const highlightMeta = highlightReg.exec(meta)?.[0];
  if (highlightMeta) {
    result = meta.replace(highlightReg, '').trim();
  }
  result = result.split('=')[1] ?? '';
  return result?.replace(/["'`]/g, '');
}

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
