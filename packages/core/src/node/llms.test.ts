import { describe, expect, it } from '@rstest/core';
import {
  isLlmsHintEnabled,
  isLlmsUIEnabled,
  renderLlmsHiddenHint,
} from './llms';

describe('LLMS UI build config', () => {
  it('allows llmsUI false to override llms', () => {
    const config = {
      llms: true,
      themeConfig: {
        llmsUI: false,
      },
    };

    expect(isLlmsUIEnabled(config)).toBe(false);
    expect(isLlmsHintEnabled(config)).toBe(false);
  });

  it('allows the hidden hint to be disabled independently', () => {
    expect(
      isLlmsHintEnabled({
        llms: true,
        themeConfig: {
          llmsUI: {
            injectLlmsHint: false,
          },
        },
      }),
    ).toBe(false);
  });

  it('renders the same hidden markup used by React SSR', () => {
    expect(
      renderLlmsHiddenHint(
        {
          base: '/docs/',
          siteOrigin: 'https://example.com',
          themeConfig: {
            llmsUI: true,
          },
        },
        '/guide/',
      ),
    ).toBe(
      '<div style="display:none" hidden="" aria-hidden="true">Are you an LLM? View https://example.com/docs/llms.txt for optimized Markdown documentation, or https://example.com/docs/llms-full.txt for full documentation bundle. This page is also available as Markdown at https://example.com/docs/guide/index.md</div>',
    );
  });
});
