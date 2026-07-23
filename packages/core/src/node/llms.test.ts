import { describe, expect, it } from '@rstest/core';
import { isLlmsHintEnabled, isLlmsUIEnabled } from './llms';

describe('LLMS UI build config', () => {
  it('allows llmsUI false to override llms', () => {
    const config = {
      llms: true,
      themeConfig: {
        llmsUI: false,
      },
    };

    expect(isLlmsUIEnabled(config)).toBe(false);
    expect(isLlmsHintEnabled(config, true)).toBe(false);
  });

  it('allows the LLM directive hint to be disabled independently', () => {
    expect(
      isLlmsHintEnabled(
        {
          llms: true,
          themeConfig: {
            llmsUI: {
              injectLlmsHint: false,
            },
          },
        },
        true,
      ),
    ).toBe(false);
  });

  it('only enables the LLM directive hint for SSG builds', () => {
    const config = {
      llms: true,
      themeConfig: {
        llmsUI: true,
      },
    };

    expect(isLlmsHintEnabled(config, true)).toBe(true);
    expect(isLlmsHintEnabled(config, false)).toBe(false);
    expect(
      isLlmsHintEnabled(
        {
          ...config,
          ssg: false,
        },
        true,
      ),
    ).toBe(false);
  });
});
