/// <reference types="webmcp-types" />

import { describe, expect, test } from '@rstest/core';
import { registerWebMcpTool } from '../src/runtime/register';
import type {
  WebMcpModelContext,
  WebMcpTool,
  WebMcpToolAnnotations,
  WebMcpToolRegistrationOptions,
} from '../src/runtime/types';

type Assert<T extends true> = T;
type IsAssignable<TSource, TTarget> = [TSource] extends [TTarget]
  ? true
  : false;

const compatibilityAssertions: [
  Assert<IsAssignable<WebMcpToolAnnotations, WebMCP.ToolAnnotations>>,
  Assert<IsAssignable<WebMcpTool, WebMCP.ModelContextTool>>,
  Assert<
    IsAssignable<
      WebMcpToolRegistrationOptions,
      Omit<WebMCP.ModelContextRegisterToolOptions, 'signal'>
    >
  >,
  Assert<
    IsAssignable<WebMcpModelContext, Pick<WebMCP.ModelContext, 'registerTool'>>
  >,
] = [true, true, true, true];

describe('WebMCP public types', () => {
  test('remains structurally compatible with WebMCP types', () => {
    expect(compatibilityAssertions).toEqual([true, true, true, true]);
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
        properties: { query: { type: ['string', 'null'] } },
        required: ['query'],
      },
      outputSchema: {
        oneOf: [
          {
            type: 'object',
            properties: { result: { type: ['string', 'null'] } },
            required: ['result'],
          },
        ],
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
