import { useWebMcpTool } from '@rspress/plugin-webmcp/runtime';

export function PageScopedTool() {
  useWebMcpTool({
    name: 'fixture_page_scoped',
    description: 'Return a value only while the guide page is mounted.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: () => ({ page: 'guide' }),
  });
  return null;
}
