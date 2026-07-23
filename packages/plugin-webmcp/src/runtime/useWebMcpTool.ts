import { type DependencyList, useEffect, useRef, useState } from 'react';
import { registerWebMcpTool } from './register';
import type {
  WebMcpTool,
  WebMcpToolHookState,
  WebMcpToolRegistrationOptions,
} from './types';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function toDescriptorDependency(value: unknown) {
  try {
    return { key: JSON.stringify(value), error: null };
  } catch (error) {
    const cause = toError(error);
    return {
      key: `serialization-error:${cause.name}:${cause.message}`,
      error: new TypeError(
        `WebMCP tool descriptors must be JSON-serializable: ${cause.message}`,
        { cause },
      ),
    };
  }
}

export function useWebMcpTool<
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
  TName extends string = string,
>(
  tool: WebMcpTool<TInput, TResult, TName>,
  options: WebMcpToolRegistrationOptions = {},
  deps: DependencyList = [],
): WebMcpToolHookState {
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const [state, setState] = useState<WebMcpToolHookState>({
    status: 'registering',
    error: null,
  });
  const { execute: _execute, ...descriptor } = tool;
  const registrationDependency = toDescriptorDependency({
    ...descriptor,
    options,
  });

  useEffect(() => {
    if (registrationDependency.error) {
      setState({ status: 'error', error: registrationDependency.error });
      return;
    }
    const registeredTool: WebMcpTool<TInput, TResult, TName> = {
      ...toolRef.current,
      execute: (input, client) => toolRef.current.execute(input, client),
    };
    const registration = registerWebMcpTool(registeredTool, options);

    if (!registration) {
      setState({ status: 'unsupported', error: null });
      return;
    }

    setState({ status: 'registering', error: null });
    let active = true;
    registration.ready.then(
      () => {
        if (active) {
          setState({ status: 'registered', error: null });
        }
      },
      error => {
        if (active) {
          setState({ status: 'error', error: toError(error) });
        }
      },
    );

    return () => {
      active = false;
      registration.unregister();
    };
  }, [registrationDependency.key, ...deps]);

  return state;
}
