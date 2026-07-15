type WebMcpJsonPrimitive = string | number | boolean | null;
type WebMcpJsonValue =
  WebMcpJsonPrimitive | { [key: string]: WebMcpJsonValue } | WebMcpJsonValue[];
type WebMcpJsonSchemaType =
  'string' | 'number' | 'integer' | 'boolean' | 'null' | 'object' | 'array';
type WebMcpJsonSchemaTypeArray = readonly [
  WebMcpJsonSchemaType,
  ...WebMcpJsonSchemaType[],
];

interface WebMcpJsonSchemaMetadata {
  default?: WebMcpJsonValue;
  description?: string;
  examples?: readonly WebMcpJsonValue[];
  nullable?: boolean;
  title?: string;
  [keyword: string]: unknown;
}

interface WebMcpJsonSchemaString extends WebMcpJsonSchemaMetadata {
  const?: string;
  enum?: readonly string[];
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  type: 'string';
}

interface WebMcpJsonSchemaNumber extends WebMcpJsonSchemaMetadata {
  const?: number;
  enum?: readonly number[];
  exclusiveMaximum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  minimum?: number;
  multipleOf?: number;
  type: 'number' | 'integer';
}

interface WebMcpJsonSchemaBoolean extends WebMcpJsonSchemaMetadata {
  const?: boolean;
  enum?: readonly boolean[];
  type: 'boolean';
}

interface WebMcpJsonSchemaNull extends WebMcpJsonSchemaMetadata {
  const?: null;
  enum?: readonly null[];
  type: 'null';
}

interface WebMcpJsonSchemaArray extends WebMcpJsonSchemaMetadata {
  items: WebMcpJsonSchema;
  maxItems?: number;
  minItems?: number;
  type: 'array';
  uniqueItems?: boolean;
}

interface WebMcpJsonSchemaObject extends WebMcpJsonSchemaMetadata {
  additionalProperties?: boolean | WebMcpJsonSchema;
  maxProperties?: number;
  minProperties?: number;
  properties?: Readonly<Record<string, WebMcpJsonSchema>>;
  required?: readonly string[];
  type: 'object';
}

interface WebMcpJsonSchemaMultiType extends WebMcpJsonSchemaMetadata {
  additionalProperties?: boolean | WebMcpJsonSchema;
  const?: WebMcpJsonValue;
  enum?: readonly WebMcpJsonValue[];
  items?: WebMcpJsonSchema;
  properties?: Readonly<Record<string, WebMcpJsonSchema>>;
  required?: readonly string[];
  type: WebMcpJsonSchemaTypeArray;
}

export type WebMcpJsonSchema =
  | WebMcpJsonSchemaArray
  | WebMcpJsonSchemaBoolean
  | WebMcpJsonSchemaMultiType
  | WebMcpJsonSchemaNull
  | WebMcpJsonSchemaNumber
  | WebMcpJsonSchemaObject
  | WebMcpJsonSchemaString;

export interface WebMcpInputSchemaProperty {
  description?: string;
  type?: string;
  [keyword: string]: unknown;
}

export interface WebMcpInputSchema {
  properties?: Record<string, WebMcpInputSchemaProperty>;
  required?: readonly string[];
  type?: string;
  [keyword: string]: unknown;
}

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
  TInput extends Record<string, unknown> = Record<string, unknown>,
  TResult = unknown,
  TName extends string = string,
> {
  name: TName;
  title?: string;
  description: string;
  inputSchema?: WebMcpInputSchema;
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
  registerTool<
    TInput extends Record<string, unknown>,
    TResult,
    TName extends string,
  >(
    tool: WebMcpTool<TInput, TResult, TName>,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ): Promise<void>;
}
