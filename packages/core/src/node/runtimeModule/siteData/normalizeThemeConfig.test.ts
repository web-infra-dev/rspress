import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { normalizeThemeConfig } from './normalizeThemeConfig';

describe('normalizeThemeConfig', () => {
  it('should normalize lastUpdated author callback for runtime site data', async () => {
    const author = ({ name }: { name: string }) => name;
    const config: UserConfig = {
      themeConfig: {
        lastUpdated: {
          author,
        },
      },
    };

    const themeConfig = await normalizeThemeConfig(config);

    expect(themeConfig.lastUpdated).toEqual({
      author: true,
    });
    expect(
      typeof (config.themeConfig?.lastUpdated as { author: unknown }).author,
    ).toBe('function');
  });
});
