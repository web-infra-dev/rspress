import type { ShikiTransformer } from 'shiki';

export const SHIKI_TRANSFORMER_ADD_TOGGLE = 'shiki-transformer:add-toggle';

const DEFAULT_TOGGLE_HEIGHT = 300;

function hasToggleInMeta(meta: string | undefined): boolean | undefined {
  if (!meta) {
    return undefined;
  }
  const kvList = meta.split(' ').filter(Boolean);
  if (kvList.includes('toggle=false')) {
    return false;
  }
  if (kvList.includes('toggle') || kvList.includes('toggle=true')) {
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
export function transformerAddToggle(): ShikiTransformer {
  return {
    name: SHIKI_TRANSFORMER_ADD_TOGGLE,
    pre(pre) {
      const meta = this.options.meta?.__raw;
      const shouldToggle = hasToggleInMeta(meta);

      if (shouldToggle) {
        const height = parseHeightFromMeta(meta) ?? DEFAULT_TOGGLE_HEIGHT;
        pre.properties = {
          ...pre.properties,
          toggle: true,
          height,
        };
      }
      return pre;
    },
  };
}
