import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { describe, expect, it, rs } from '@rstest/core';
import { fs, vol } from 'memfs';
import type { NavJson } from '../../src/node/auto-nav-sidebar/type';
import {
  hintBuilderPluginsBreakingChange,
  hintNavJsonChangeThenPanic,
  hintThemeBreakingChange,
} from '../../src/node/logger/hint';

rs.mock('node:fs/promises', () => {
  return { default: fs.promises, ...fs.promises };
});
rs.mock('@rspress/shared/logger', () => ({
  logger: {
    info: rs.fn(),
    warn: rs.fn(),
    error: rs.fn(),
    success: rs.fn(),
  },
}));

describe('hintThemeBreakingChange', () => {
  it('should log a warning when theme/index.tsx is using default exports', async () => {
    vol.fromJSON({
      '/theme/index.tsx': `
        const Theme = {};
        export default {
          ...Theme
        }
      `,
    });
    await hintThemeBreakingChange('/theme');
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('hintBuilderPluginsBreakingChange', () => {
  it('should throw an error with migration instructions', () => {
    const config = { builderPlugins: [{}] } as UserConfig;
    expect(() => hintBuilderPluginsBreakingChange(config)).toThrow(
      /"builderPlugins".*"builderConfig.plugins"[\s\S]*export default defineConfig/,
    );
  });

  it('should accept current config and empty legacy plugins', () => {
    expect(() => hintBuilderPluginsBreakingChange({})).not.toThrow();
    expect(() =>
      hintBuilderPluginsBreakingChange({ builderPlugins: [] } as UserConfig),
    ).not.toThrow();
    expect(() =>
      hintBuilderPluginsBreakingChange({ builderConfig: { plugins: [] } }),
    ).not.toThrow();
  });
});

describe('hintNavJsonChangeThenPanic', () => {
  it.each([{ text: 'Guide', link: '/guide' }, { activeMatch: '/guide' }])(
    'should throw an error with the affected paths for %j',
    item => {
      expect(() =>
        hintNavJsonChangeThenPanic([item] as NavJson, '/docs/en', '/docs'),
      ).toThrow(
        `Please rename "${path.join('en', '_meta.json')}" to "${path.join('en', '_nav.json')}".`,
      );
    },
  );

  it('should accept v2 sidebar and custom-link entries', () => {
    expect(() =>
      hintNavJsonChangeThenPanic(
        [
          'index',
          { type: 'custom-link', text: 'Guide', link: '/guide' },
        ] as unknown as NavJson,
        '/docs',
        '/docs',
      ),
    ).not.toThrow();
  });
});
