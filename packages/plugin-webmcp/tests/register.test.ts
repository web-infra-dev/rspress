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

  test('exposes synchronous and asynchronous registration failures', async () => {
    const syncError = new Error('sync failure');
    let syncSignal: AbortSignal | undefined;
    setDocument({
      modelContext: {
        registerTool(_tool: WebMcpTool, options: { signal?: AbortSignal }) {
          syncSignal = options.signal;
          throw syncError;
        },
      },
    });
    await expect(registerWebMcpTool(tool)?.ready).rejects.toBe(syncError);
    expect(syncSignal?.aborted).toBe(true);

    const asyncError = new Error('async failure');
    let asyncSignal: AbortSignal | undefined;
    setDocument({
      modelContext: {
        registerTool(_tool: WebMcpTool, options: { signal?: AbortSignal }) {
          asyncSignal = options.signal;
          return Promise.reject(asyncError);
        },
      },
    });
    await expect(registerWebMcpTool(tool)?.ready).rejects.toBe(asyncError);
    expect(asyncSignal?.aborted).toBe(true);
  });
});
