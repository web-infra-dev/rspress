import { describe, expect, test } from '@rstest/core';
import { resolveWebMcpOptions } from './webMcp';

describe('WebMCP configuration', () => {
  test('is enabled by default without requiring or changing llms configuration', () => {
    const config = {};
    expect(resolveWebMcpOptions(config, true)).toEqual({
      markdown: false,
      search: true,
    });
    expect(config).toEqual({});
    expect(resolveWebMcpOptions({ webMcp: true }, true)).toEqual({
      markdown: false,
      search: true,
    });
    expect(resolveWebMcpOptions({ llms: true }, true)).toEqual({
      markdown: true,
      search: true,
    });
    expect(resolveWebMcpOptions({ webMcp: false }, true)).toBeUndefined();
  });
  test('enables Markdown tools only for SSG and preserves disabled local search', () => {
    expect(resolveWebMcpOptions({ webMcp: true }, false)).toEqual({
      markdown: false,
      search: true,
    });
    expect(
      resolveWebMcpOptions(
        {
          webMcp: { exposedTo: ['https://agent.example'] },
          llms: true,
          search: false,
        },
        true,
      ),
    ).toEqual({
      markdown: true,
      search: false,
      exposedTo: ['https://agent.example'],
    });
  });
});
