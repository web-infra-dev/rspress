import { describe, expect, test } from '@rstest/core';
import { pluginRss } from '../src/plugin-rss';

describe('plugin-rss SSG requirement', () => {
  test.each([undefined, false, true])(
    'should reject production builds with ssg disabled and llms=%s',
    llms => {
      const plugin = pluginRss();
      expect(() => plugin.beforeBuild!({ ssg: false, llms }, true)).toThrow(
        'RSS plugin requires SSG to be enabled',
      );
    },
  );

  test.each([undefined, false, true])(
    'should allow SSG builds with llms=%s',
    llms => {
      const plugin = pluginRss();
      expect(() => plugin.beforeBuild!({ llms }, true)).not.toThrow();
    },
  );

  test('should allow development without SSG', () => {
    const plugin = pluginRss();
    expect(() =>
      plugin.beforeBuild!({ ssg: false, llms: true }, false),
    ).not.toThrow();
  });
});
