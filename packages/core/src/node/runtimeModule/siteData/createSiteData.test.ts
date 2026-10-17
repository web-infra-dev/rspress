import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { createSiteData } from './createSiteData';

const fileLogo = new URL('file:///assets/logo%20light.svg');
const remoteLogo = new URL('https://example.com/logo.svg');

describe('site data logo', () => {
  it.each([
    [undefined, ''],
    ['/logo.svg', '/logo.svg'],
    ['https://example.com/logo.svg', 'https://example.com/logo.svg'],
    [fileLogo, fileLogo.href],
    [fileLogo.href, fileLogo.href],
    [remoteLogo, remoteLogo.href],
    [
      { light: fileLogo, dark: '/dark.svg' },
      { light: fileLogo.href, dark: '/dark.svg' },
    ],
    [
      { light: '/light.svg', dark: remoteLogo },
      { light: '/light.svg', dark: remoteLogo.href },
    ],
  ] satisfies [UserConfig['logo'], unknown][])(
    'normalizes %j into runtime strings',
    async (logo, expected) => {
      const config: UserConfig = { logo };
      const { siteData } = await createSiteData(config);
      expect(siteData.logo).toEqual(expected);
      expect(config.logo).toBe(logo);
    },
  );
});
