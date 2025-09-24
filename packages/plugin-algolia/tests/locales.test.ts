import { describe, expect, test } from 'vitest';
import { ZH_LOCALES } from '../src/runtime/locales';

describe('Docsearch v4 Locales', () => {
  test('should have correct translation property names for v4', () => {
    const zhLocale = ZH_LOCALES.zh;

    // Check if the new v4 property names are used
    expect(
      zhLocale.translations?.modal?.searchBox?.clearButtonTitle,
    ).toBeDefined();
    expect(
      zhLocale.translations?.modal?.searchBox?.clearButtonAriaLabel,
    ).toBeDefined();
    expect(
      zhLocale.translations?.modal?.searchBox?.closeButtonText,
    ).toBeDefined();
    expect(
      zhLocale.translations?.modal?.searchBox?.closeButtonAriaLabel,
    ).toBeDefined();
    expect(zhLocale.translations?.modal?.footer?.poweredByText).toBeDefined();

    // Check the actual values
    expect(zhLocale.translations?.modal?.searchBox?.clearButtonTitle).toBe(
      '清除查询条件',
    );
    expect(zhLocale.translations?.modal?.footer?.poweredByText).toBe(
      '搜索提供者',
    );

    // Ensure old v3 properties are not used
    expect(
      (zhLocale.translations?.modal?.searchBox as any)?.resetButtonTitle,
    ).toBeUndefined();
    expect(
      (zhLocale.translations?.modal?.footer as any)?.searchByText,
    ).toBeUndefined();
  });

  test('should have placeholder text', () => {
    const zhLocale = ZH_LOCALES.zh;
    expect(zhLocale.placeholder).toBe('搜索文档');
  });
});
