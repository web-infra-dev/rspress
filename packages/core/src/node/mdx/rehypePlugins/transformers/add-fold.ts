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

export interface ITransformerAddFoldOptions {
  defaultCodeOverflow?: {
    height?: number;
    behavior?: 'fold' | 'scroll';
  };
}

/**
 * @private compile-time only
 */
export function transformerAddFold(
  options: ITransformerAddFoldOptions = {},
): ShikiTransformer {
  const { defaultCodeOverflow } = options;

  return {
    name: SHIKI_TRANSFORMER_ADD_FOLD,
    pre(pre) {
      const meta = this.options.meta?.__raw;
      const metaFold = hasFoldInMeta(meta);
      const metaHeight = parseHeightFromMeta(meta);
      const hasExplicitMeta =
        metaFold !== undefined || metaHeight !== undefined;

      if (hasExplicitMeta) {
        // Explicit meta takes priority
        if (metaFold) {
          pre.properties = {
            ...pre.properties,
            fold: true,
            height: metaHeight ?? DEFAULT_FOLD_HEIGHT,
          };
        } else if (metaHeight !== undefined) {
          pre.properties = {
            ...pre.properties,
            height: metaHeight,
          };
        }
      } else if (defaultCodeOverflow?.height !== undefined) {
        // Fall back to site-wide config
        const behavior = defaultCodeOverflow.behavior ?? 'scroll';
        if (behavior === 'fold') {
          pre.properties = {
            ...pre.properties,
            fold: true,
            height: defaultCodeOverflow.height,
          };
        } else {
          pre.properties = {
            ...pre.properties,
            height: defaultCodeOverflow.height,
          };
        }
      }

      return pre;
    },
  };
}
