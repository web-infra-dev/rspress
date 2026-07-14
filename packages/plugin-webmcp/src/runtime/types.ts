export type WebMcpJsonSchema = Record<string, unknown>;

export interface WebMcpToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

/** Optional compatibility client supplied by runtimes that implement it. */
export interface WebMcpModelContextClient {
  requestUserInteraction(callback: () => Promise<unknown>): Promise<unknown>;
}

export interface WebMcpTool<
  TInput extends object = Record<string, unknown>,
  TResult = unknown,
  TName extends string = string,
> {
  name: TName;
  title?: string;
  description: string;
  inputSchema?: WebMcpJsonSchema;
  /** Compatibility extension; not yet part of the native WebMCP draft. */
  outputSchema?: WebMcpJsonSchema;
  annotations?: WebMcpToolAnnotations;
  execute(
    input: TInput,
    client?: WebMcpModelContextClient,
  ): TResult | Promise<TResult>;
}

export interface WebMcpToolRegistrationOptions {
  exposedTo?: string[];
}

export interface WebMcpToolRegistration {
  ready: Promise<void>;
  unregister(): void;
}

export type WebMcpToolStatus =
  'registering' | 'registered' | 'unsupported' | 'error';

export interface WebMcpToolHookState {
  status: WebMcpToolStatus;
  error: Error | null;
}

export interface WebMcpModelContext {
  registerTool<TInput extends object, TResult, TName extends string>(
    tool: WebMcpTool<TInput, TResult, TName>,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
}
