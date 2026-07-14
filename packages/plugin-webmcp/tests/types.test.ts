import type {
  ModelContextClient,
  ToolAnnotations,
  ToolDescriptor,
} from '@mcp-b/webmcp-types';
import { describe, expect, test } from '@rstest/core';
import { registerWebMcpTool } from '../src/runtime/register';
import type {
  WebMcpModelContextClient,
  WebMcpTool,
  WebMcpToolAnnotations,
} from '../src/runtime/types';

type Assert<T extends true> = T;
type IsAssignable<TSource, TTarget> = [TSource] extends [TTarget]
  ? true
  : false;

type _AnnotationsMatch = Assert<
  IsAssignable<WebMcpToolAnnotations, ToolAnnotations>
>;
type _ClientMatches = Assert<
  IsAssignable<WebMcpModelContextClient, ModelContextClient>
>;
type _ToolMatches = Assert<
  IsAssignable<
    WebMcpTool<{ query: string }, { result: string }, 'typed_search'>,
    ToolDescriptor<{ query: string }, { result: string }, 'typed_search'>
  >
>;

describe('WebMCP public types', () => {
  test('preserves custom input, result, and name generics', () => {
    const registration = registerWebMcpTool<
      { query: string },
      { result: string },
      'typed_search'
    >({
      name: 'typed_search',
      description: 'Exercise the typed registration API.',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: { result: { type: 'string' } },
        required: ['result'],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      execute(input, client) {
        void client?.requestUserInteraction(async () => undefined);
        return { result: input.query };
      },
    });

    expect(registration).toBeUndefined();
  });
});
