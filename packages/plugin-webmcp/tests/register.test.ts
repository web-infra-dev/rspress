import { afterEach, describe, expect, test } from '@rstest/core';
import { registerWebMcpTool } from '../src/runtime/register';
import type { WebMcpTool } from '../src/runtime/types';

const tool: WebMcpTool = {
  name: 'test_tool',
  title: 'Test tool',
  description: 'Test descriptor forwarding.',
  inputSchema: { type: 'object' },
  annotations: { readOnlyHint: true },
  execute: () => ({ ok: true }),
};

function setDocument(value: unknown) {
  Object.defineProperty(globalThis, 'document', {
    value,
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'document');
});

describe('registerWebMcpTool', () => {
  test('returns undefined in unsupported environments', () => {
    expect(registerWebMcpTool(tool)).toBeUndefined();
  });

  test('forwards the descriptor and exposed origins', async () => {
    let registeredTool: WebMcpTool | undefined;
    let registeredOptions:
      { signal?: AbortSignal; exposedTo?: string[] } | undefined;
    setDocument({
      modelContext: {
        registerTool(
          descriptor: WebMcpTool,
          options: { signal?: AbortSignal; exposedTo?: string[] },
        ) {
          registeredTool = descriptor;
          registeredOptions = options;
          return Promise.resolve();
        },
      },
    });

    const registration = registerWebMcpTool(tool, {
      exposedTo: ['https://agent.example'],
    });
    await registration?.ready;
    expect(registeredTool).toBe(tool);
    expect(registeredOptions?.exposedTo).toEqual(['https://agent.example']);
    expect(registeredOptions?.signal?.aborted).toBe(false);

    registration?.unregister();
    expect(registeredOptions?.signal?.aborted).toBe(true);
  });

  test.each(['synchronous', 'asynchronous'] as const)(
    'exposes %s registration failures',
    async mode => {
      const error = new Error(`${mode} failure`);
      let signal: AbortSignal | undefined;
      setDocument({
        modelContext: {
          registerTool(_tool: WebMcpTool, options: { signal?: AbortSignal }) {
            signal = options.signal;
            if (mode === 'synchronous') {
              throw error;
            }
            return Promise.reject(error);
          },
        },
      });

      await expect(registerWebMcpTool(tool)?.ready).rejects.toBe(error);
      expect(signal?.aborted).toBe(true);
    },
  );
});
