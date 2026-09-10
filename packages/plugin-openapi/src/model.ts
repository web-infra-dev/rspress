import {
  HTTP_METHODS,
  type OpenAPIDocument,
  type OperationData,
  type Schema,
  type MediaType,
} from './types';

/** Resolve only the current node, keeping recursive schemas finite. */
export function resolveRef<T extends { $ref?: string }>(
  document: OpenAPIDocument,
  value: T,
): T {
  const seen = new Set<string>();
  let result = value;
  while (result.$ref) {
    const ref = result.$ref;
    if (seen.has(ref)) throw new Error(`Circular reference alias: ${ref}`);
    seen.add(ref);
    if (!ref.startsWith('#/'))
      throw new Error(`Expected a bundled local reference: ${ref}`);
    let target: unknown = document;
    for (const part of ref.slice(2).split('/')) {
      const key = decodeURIComponent(part)
        .replace(/~1/g, '/')
        .replace(/~0/g, '~');
      if (!target || typeof target !== 'object' || !Object.hasOwn(target, key))
        throw new Error(`Unresolved reference: ${ref}`);
      target = (target as Record<string, unknown>)[key];
    }
    const { $ref: _, ...siblings } = result;
    result = { ...(target as T), ...siblings };
  }
  return result;
}

export function getOperations(document: OpenAPIDocument): OperationData[] {
  if (!/^3\.(0|1)\./.test(document.openapi ?? ''))
    throw new Error('plugin-openapi requires OpenAPI 3.0 or 3.1.');
  if (
    !document.info?.title ||
    !document.paths ||
    typeof document.paths !== 'object'
  )
    throw new Error('OpenAPI requires info.title and paths.');
  const ids = new Set<string>();
  return Object.entries(document.paths).flatMap(([path, raw]) => {
    const item = resolveRef(document, raw);
    return HTTP_METHODS.flatMap(method => {
      const operation = item[method];
      if (!operation) return [];
      const id = operation.operationId || `${method}-${path}`;
      if (ids.has(id)) throw new Error(`Duplicate OpenAPI operation ID: ${id}`);
      ids.add(id);
      const parameters = new Map(
        [...(item.parameters ?? []), ...(operation.parameters ?? [])].map(
          parameter => {
            const resolved = resolveRef(document, parameter);
            return [`${resolved.in}:${resolved.name}`, resolved] as const;
          },
        ),
      );
      return [
        {
          id,
          path,
          method,
          operation,
          parameters: [...parameters.values()],
          servers: operation.servers ??
            item.servers ??
            document.servers ?? [{ url: '/' }],
          security: operation.security ?? document.security ?? [],
        },
      ];
    });
  });
}

/** Examples are illustrative; explicit examples take precedence over synthesis. */
export function schemaExample(
  document: OpenAPIDocument,
  raw: Schema = {},
  depth = 0,
): unknown {
  if (depth > 6) return undefined;
  const schema = resolveRef(document, raw);
  if (schema.example !== undefined) return schema.example;
  if (schema.examples?.length) return schema.examples[0];
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  const variant = schema.oneOf?.[0] ?? schema.anyOf?.[0];
  if (variant) return schemaExample(document, variant, depth + 1);
  if (schema.allOf)
    return Object.assign(
      {},
      ...schema.allOf.map(part => schemaExample(document, part, depth + 1)),
    );
  if (schema.properties)
    return Object.fromEntries(
      Object.entries(schema.properties)
        .map(([name, property]) => [
          name,
          schemaExample(document, property, depth + 1),
        ])
        .filter(([, value]) => value !== undefined),
    );
  if (schema.items)
    return [schemaExample(document, schema.items, depth + 1)].filter(
      value => value !== undefined,
    );
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === 'boolean') return false;
  if (type === 'integer' || type === 'number') return 0;
  if (type === 'null') return null;
  return 'string';
}
export function mediaExample(
  document: OpenAPIDocument,
  media?: MediaType,
): unknown {
  if (!media) return undefined;
  if (media.example !== undefined) return media.example;
  const example = Object.values(media.examples ?? {})[0];
  if (example) return resolveRef(document, example).value;
  return media.schema ? schemaExample(document, media.schema) : undefined;
}
