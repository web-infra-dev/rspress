import { describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { LlmsHiddenHint } from './LlmsHiddenHint';

rs.mock('@rspress/core/runtime', () => ({
  withBase: (path: string) => `/docs${path}`,
  withSiteOrigin: (path: string) => `https://example.com${path}`,
}));

describe('LlmsHiddenHint', () => {
  it('renders hidden links to the LLM documentation files', () => {
    const html = renderToStaticMarkup(<LlmsHiddenHint />);

    expect(html).toContain('style="display:none"');
    expect(html).toContain('hidden=""');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(
      'Are you an LLM? View https://example.com/docs/llms.txt for optimized Markdown documentation, or https://example.com/docs/llms-full.txt for full documentation bundle',
    );
  });
});
