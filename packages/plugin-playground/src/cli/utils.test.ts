import { describe, expect, it } from '@rstest/core';
import type { Code } from 'mdast';
import { getNodeMeta } from './utils';

const code = (meta?: string): Code => ({
  type: 'code',
  meta,
  lang: 'tsx',
  value: '',
});

describe('getNodeMeta', () => {
  it('strips quotes from quoted meta values', () => {
    // regression: /'"`/ is a literal three-character sequence instead of
    // a character class, so quoted values kept their quotes and
    // direction="vertical" produced an invalid rp-playground-"vertical"
    // class name and never matched the horizontal check.
    expect(getNodeMeta(code('direction="vertical"'), 'direction')).toBe(
      'vertical',
    );
    expect(getNodeMeta(code("direction='vertical'"), 'direction')).toBe(
      'vertical',
    );
    expect(getNodeMeta(code('direction=`vertical`'), 'direction')).toBe(
      'vertical',
    );
  });

  it('returns unquoted values as-is', () => {
    expect(getNodeMeta(code('direction=vertical'), 'direction')).toBe(
      'vertical',
    );
  });

  it('does not match meta names by bare prefix', () => {
    // regression: startsWith(metaName) matched direction2=... for
    // direction and returned the whole raw item.
    expect(
      getNodeMeta(code('direction2=vertical'), 'direction'),
    ).toBeUndefined();
  });

  it('returns bare meta names unchanged', () => {
    expect(getNodeMeta(code('vertical'), 'direction')).toBeUndefined();
    expect(getNodeMeta(code('direction'), 'direction')).toBe('direction');
  });
});
