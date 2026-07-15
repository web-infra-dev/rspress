import type {
  InputSchema,
  JsonSchemaForInference,
  ModelContextClient,
  ToolAnnotations,
  ToolDescriptor,
} from '@mcp-b/webmcp-types';
import { describe, expect, test } from '@rstest/core';
import { registerWebMcpTool } from '../src/runtime/register';
import type {
  WebMcpInputSchema,
  WebMcpJsonSchema,
  WebMcpModelContextClient,
  WebMcpTool,
  WebMcpToolAnnotations,
} from '../src/runtime/types';

type Assert<T extends true> = T;
type IsAssignable<TSource, TTarget> = [TSource] extends [TTarget]
  ? true
  : false;

const compatibilityAssertions: [
  Assert<IsAssignable<WebMcpInputSchema, InputSchema>>,
  Assert<IsAssignable<WebMcpJsonSchema, JsonSchemaForInference>>,
  Assert<IsAssignable<WebMcpToolAnnotations, ToolAnnotations>>,
  Assert<IsAssignable<WebMcpModelContextClient, ModelContextClient>>,
  Assert<
    IsAssignable<
      WebMcpTool<{ query: string }, { result: string }, 'typed_search'>,
      ToolDescriptor<{ query: string }, { result: string }, 'typed_search'>
    >
  >,
] = [true, true, true, true, true];

describe('WebMCP public types', () => {
  test('remains structurally compatible with MCP-B types', () => {
    expect(compatibilityAssertions).toEqual([true, true, true, true, true]);
  });

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
