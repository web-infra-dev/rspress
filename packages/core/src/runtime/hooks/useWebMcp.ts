import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface WebMcpExecuteOptions {
  /** Cancellation requested by the browser or agent. */
  signal?: AbortSignal;
}

export interface WebMcpOptions<TInput = unknown, TResult = unknown> {
  name: string;
  title?: string;
  description: string;
  /** JSON Schema describing the input. Validate untrusted inputs in execute. */
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    debugging?: boolean;
  };
  execute(
    input: TInput,
    options: WebMcpExecuteOptions,
  ): TResult | Promise<TResult>;
  /** Register only while enabled. Defaults to true. */
  enabled?: boolean;
  /** Additional secure origins allowed to discover this tool. */
  exposedTo?: string[];
}

export interface WebMcpState {
  supported: boolean;
  registered: boolean;
  /** Registration error. Execution errors are returned to the caller. */
  error: Error | null;
}

interface ModelContext {
  registerTool(
    tool: Omit<WebMcpOptions, 'enabled' | 'exposedTo'>,
    options: { signal: AbortSignal; exposedTo?: string[] },
  ): Promise<void> | void;
}

const useCommittedEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
const toError = (error: unknown) =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Registers a component-owned tool with the native browser WebMCP API.
 * Calls use the latest committed handler; disabling or unmounting unregisters
 * the tool. Safe during SSR and in browsers without WebMCP support.
 * @returns Browser support, registration status, and any registration error.
 * @unstable
 */
export function useWebMcp<TInput = unknown, TResult = unknown>(
  options: WebMcpOptions<TInput, TResult>,
): WebMcpState {
  const { execute, enabled = true, exposedTo, ...descriptor } = options;
  const current = useRef(execute);
  useCommittedEffect(() => {
    current.current = execute;
  });

  // Compare descriptor contents so inline schemas do not churn registrations.
  // Serializing also keeps non-serializable metadata out of the browser API.
  let key = '';
  let preparationError: Error | null = null;
  try {
    key = JSON.stringify({ descriptor, exposedTo });
  } catch (error) {
    preparationError = toError(error);
  }
  const preparationMessage = preparationError?.message;
  const [state, setState] = useState<WebMcpState>({
    supported: false,
    registered: false,
    error: null,
  });

  useEffect(() => {
    const context =
      typeof document === 'undefined'
        ? undefined
        : (document as Document & { modelContext?: ModelContext }).modelContext;
    const supported = typeof context?.registerTool === 'function';
    if (!supported || !enabled || preparationMessage !== undefined) {
      setState({
        supported,
        registered: false,
        error:
          preparationMessage === undefined
            ? null
            : new Error(preparationMessage),
      });
      return;
    }

    const controller = new AbortController();
    const metadata = JSON.parse(key) as {
      descriptor: Omit<WebMcpOptions, 'execute' | 'enabled' | 'exposedTo'>;
      exposedTo?: string[];
    };
    setState({ supported: true, registered: false, error: null });
    const failed = (error: unknown) => {
      if (controller.signal.aborted) return;
      controller.abort();
      setState({ supported: true, registered: false, error: toError(error) });
      console.error(
        `[Rspress] Failed to register ${metadata.descriptor.name}:`,
        error,
      );
    };
    try {
      const registration = context!.registerTool(
        {
          ...metadata.descriptor,
          execute: (input, executionOptions) => {
            executionOptions?.signal?.throwIfAborted();
            return current.current(input as TInput, executionOptions ?? {});
          },
        },
        { signal: controller.signal, exposedTo: metadata.exposedTo },
      );
      void Promise.resolve(registration).then(() => {
        if (!controller.signal.aborted) {
          setState({ supported: true, registered: true, error: null });
        }
      }, failed);
    } catch (error) {
      failed(error);
    }
    return () => controller.abort();
  }, [key, enabled, preparationMessage]);

  return state;
}
