/** JSON-compatible subset shared by the generator and browser renderer. */
export interface Schema {
  $ref?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  format?: string;
  nullable?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  enum?: unknown[];
  default?: unknown;
  example?: unknown;
  examples?: unknown[];
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  additionalProperties?: boolean | Schema;
}
export interface Parameter {
  $ref?: string;
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  style?: string;
  explode?: boolean;
  schema?: Schema;
  example?: unknown;
}
export interface MediaType {
  schema?: Schema;
  example?: unknown;
  examples?: Record<string, { value?: unknown; $ref?: string }>;
}
export interface Response {
  $ref?: string;
  description?: string;
  content?: Record<string, MediaType>;
}
export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, { default: string }>;
}
export interface SecurityScheme {
  $ref?: string;
  type: string;
  scheme?: string;
  name?: string;
  in?: string;
  description?: string;
}
export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  parameters?: Parameter[];
  requestBody?: {
    $ref?: string;
    description?: string;
    required?: boolean;
    content?: Record<string, MediaType>;
  };
  responses?: Record<string, Response>;
  servers?: Server[];
  security?: Record<string, string[]>[];
}
export interface OpenAPIDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Server[];
  security?: Record<string, string[]>[];
  paths: Record<
    string,
    {
      $ref?: string;
      parameters?: Parameter[];
      servers?: Server[];
    } & Partial<Record<HttpMethod, Operation>>
  >;
  components?: {
    schemas?: Record<string, Schema>;
    securitySchemes?: Record<string, SecurityScheme>;
    [key: string]: unknown;
  };
}
export const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
export interface OperationData {
  id: string;
  path: string;
  method: HttpMethod;
  operation: Operation;
  parameters: Parameter[];
  servers: Server[];
  security: Record<string, string[]>[];
}
