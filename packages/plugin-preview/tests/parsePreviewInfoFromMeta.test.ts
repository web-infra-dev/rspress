import { describe, expect, test } from '@rstest/core';
import { parsePreviewInfoFromMeta } from '../src/parsePreviewInfoFromMeta';

describe('parsePreviewInfoFromMeta', () => {
  test('parses preview-only for fixed iframe previews', () => {
    expect(
      parsePreviewInfoFromMeta({
        meta: 'preview="iframe-fixed" preview-only',
        defaultPreviewMode: 'internal',
        defaultRenderMode: 'pure',
      }),
    ).toEqual({
      isPure: false,
      isPreview: true,
      previewOnly: true,
      previewMode: 'iframe-fixed',
    });
  });

  test('does not match preview-only as a partial token', () => {
    expect(
      parsePreviewInfoFromMeta({
        meta: 'preview="iframe-fixed" data-preview-only="true"',
        defaultPreviewMode: 'internal',
        defaultRenderMode: 'pure',
      }).previewOnly,
    ).toBe(false);
  });
});
