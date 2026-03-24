import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_FOLD = 'shiki-transformer:add-fold';

const DEFAULT_FOLD_HEIGHT = 300;

function hasFoldInMeta(meta: string | undefined): boolean | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  if (kvList.includes('fold=false')) {
    return false;
  }
  if (kvList.includes('fold') || kvList.includes('fold=true')) {
    return true;
  }
  return undefined;
}

function parseHeightFromMeta(meta: string | undefined): number | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  for (const item of kvList) {
    const [k, v = ''] = item.split('=').filter(Boolean);
    if (k === 'height' && v.length > 0) {
      const num = Number(v.replace(/["'`]/g, ''));
      if (!Number.isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return undefined;
}

/**
 * @private compile-time only
 */
export function transformerAddFold(): ShikiTransformer {
  return {
    name: SHIKI_TRANSFORMER_ADD_FOLD,
    pre(pre) {
      const meta = this.options.meta?.__raw;
      const shouldFold = hasFoldInMeta(meta);

      if (shouldFold) {
        const height = parseHeightFromMeta(meta) ?? DEFAULT_FOLD_HEIGHT;
        pre.properties = {
          ...pre.properties,
          fold: true,
          height,
        };
      }
      return pre;
    },
  };
}
