import type {
  WebMcpModelContext,
  WebMcpTool,
  WebMcpToolRegistration,
  WebMcpToolRegistrationOptions,
} from './types';

function getModelContext(): WebMcpModelContext | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  return (document as Document & { modelContext?: WebMcpModelContext })
    .modelContext;
}

export function isWebMcpSupported(): boolean {
  return getModelContext() !== undefined;
}

export function registerWebMcpTool<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
  TName extends string = string,
>(
  tool: WebMcpTool<TInput, TResult, TName>,
  options: WebMcpToolRegistrationOptions = {},
): WebMcpToolRegistration | undefined {
  const modelContext = getModelContext();
  if (!modelContext) {
    return undefined;
  }

  const controller = new AbortController();
  const ready = (async () => {
    try {
      await modelContext.registerTool(tool, {
        signal: controller.signal,
        exposedTo: options.exposedTo,
      });
    } catch (error) {
      controller.abort();
      throw error;
    }
  })();

  return {
    ready,
    unregister() {
      controller.abort();
    },
  };
}
