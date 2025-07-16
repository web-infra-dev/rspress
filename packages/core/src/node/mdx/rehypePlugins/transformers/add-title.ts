import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_TITLE = 'shiki-transformer:add-title';

function parseTitleFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  const kvList = meta.split(' ').filter(Boolean) as string[];
  for (const item of kvList) {
    const [k, v = ''] = item.split('=').filter(Boolean);
    if (k === 'title' && v.length > 0) {
      return v.replace(/["'`]/g, '');
    }
  }
  return '';
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
