import { logger } from '@rsbuild/core';
import type { Options } from './types';

interface PreviewInfo {
  isPure: boolean;
  isPreview: boolean;
  previewMode: Options['defaultPreviewMode'] | null;
}

/**
 * Parse preview info from code block meta string
 *
 * Supported syntax:
 * - ```tsx preview="internal"
 * - ```tsx preview="iframe-fixed"
 * - ```tsx preview="iframe-follow"
 * - ```tsx preview          (use defaultPreviewMode)
 * - ```tsx pure
 *
 * @param options - Parse options
 * @returns PreviewInfo
 */
export function parsePreviewInfoFromMeta(options: {
  meta: string | null | undefined;
  defaultPreviewMode: Options['defaultPreviewMode'];
  defaultRenderMode: Options['defaultRenderMode'];
}): PreviewInfo {
  const { meta, defaultPreviewMode, defaultRenderMode } = options;

  // Default result
  const result: PreviewInfo = {
    isPure: false,
    isPreview: false,
    previewMode: null,
  };

  // No meta string
  if (!meta) {
    if (defaultRenderMode === 'preview') {
      result.isPreview = true;
      result.previewMode = defaultPreviewMode;
    } else {
      result.isPure = true;
    }
    return result;
  }

  // Check for pure mode
  if (meta.includes('pure')) {
    result.isPure = true;
    return result;
  }

  // Check for preview="<foo>" syntax
  const previewMatch = meta.match(/preview(?:="([^"]+)")?/);

  if (previewMatch) {
    result.isPreview = true;
    const explicitMode = previewMatch[1] as
      | Options['defaultPreviewMode']
      | undefined;

    if (
      explicitMode &&
      ['internal', 'iframe-fixed', 'iframe-follow'].includes(explicitMode)
    ) {
      result.previewMode = explicitMode;
    } else {
      // preview without value, use defaultPreviewMode
      result.previewMode = defaultPreviewMode;
    }
    return result;
  }

  // Check for iframe
  if (meta.includes('iframe')) {
    logger.warn(
      'The "iframe" meta is deprecated, please use \`\`\`tsx preview="iframe-fixed" or \`\`\`tsx preview="iframe-follow" instead.',
    );
  }

  // No explicit preview/pure, use defaultRenderMode
  if (defaultRenderMode === 'preview') {
    result.isPreview = true;
    result.previewMode = defaultPreviewMode;
  } else {
    result.isPure = true;
  }

  return result;
}
