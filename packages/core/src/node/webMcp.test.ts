import { describe, expect, test } from '@rstest/core';
import { resolveWebMcpOptions } from './webMcp';

describe('WebMCP configuration', () => {
  test('is opt-in and does not change llms configuration', () => {
    expect(resolveWebMcpOptions({}, true)).toBeUndefined();
    expect(resolveWebMcpOptions({ webMcp: false }, true)).toBeUndefined();
    expect(() => resolveWebMcpOptions({ webMcp: true }, true)).toThrow(
      'llms: true',
    );
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
