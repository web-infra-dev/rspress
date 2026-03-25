import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_FOLD = 'shiki-transformer:add-fold';

const DEFAULT_FOLD_HEIGHT = 300;

export interface ITransformerFoldOptions {
  /**
   * Default max height (in px) for code blocks.
   * When set, code blocks taller than this value will be collapsible.
   * Can be overridden per block with `maxHeight="..."` or `fold=false` in the meta string.
   */
  defaultMaxHeight?: number;
}

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

function parseNumericFromMeta(
  meta: string | undefined,
  key: string,
): number | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  for (const item of kvList) {
    const [k, v = ''] = item.split('=').filter(Boolean);
    if (k === key && v.length > 0) {
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
export function transformerAddFold(
  options: ITransformerFoldOptions = {},
): ShikiTransformer {
  const { defaultMaxHeight } = options;

  return {
    name: SHIKI_TRANSFORMER_ADD_FOLD,
    pre(pre) {
      const meta = this.options.meta?.__raw;
      const foldInMeta = hasFoldInMeta(meta);
      const maxHeightInMeta = parseNumericFromMeta(meta, 'maxHeight');
      const heightInMeta = parseNumericFromMeta(meta, 'height');

      // Determine the effective height:
      // 1. maxHeight in meta takes priority (new API)
      // 2. height in meta (legacy API, used with fold)
      // 3. defaultMaxHeight from config
      // 4. DEFAULT_FOLD_HEIGHT as final fallback
      const effectiveHeight =
        maxHeightInMeta ??
        heightInMeta ??
        defaultMaxHeight ??
        DEFAULT_FOLD_HEIGHT;

      // Determine whether fold should be enabled:
      // - fold=false in meta always disables
      // - fold or fold=true in meta always enables
      // - maxHeight in meta auto-enables fold
      // - defaultMaxHeight from config auto-enables fold (unless fold=false)
      const shouldFold =
        foldInMeta === false
          ? false
          : foldInMeta === true ||
            maxHeightInMeta !== undefined ||
            (defaultMaxHeight !== undefined && foldInMeta !== false);

      if (shouldFold) {
        pre.properties = {
          ...pre.properties,
          fold: true,
          height: effectiveHeight,
        };
      }
      return pre;
    },
  };
}
