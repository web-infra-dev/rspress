import { mediaExample, resolveRef } from '../model';
import type {
  MediaType,
  OpenAPIDocument,
  OperationData,
  Parameter,
  Server,
} from '../types';

export function serverURL(server: Server): string {
  return server.url.replace(
    /\{([^}]+)\}/g,
    (_, name: string) => server.variables?.[name]?.default ?? `{${name}}`,
  );
}
/** Format the initial editor value in the representation sent over HTTP. */
export function requestBodyExample(
  document: OpenAPIDocument,
  mediaType: string,
  media?: MediaType,
): string {
  const example = mediaExample(document, media);
  if (example === undefined) return '';
  const type = mediaType.split(';')[0].trim().toLowerCase();
  if (type === 'application/x-www-form-urlencoded') {
    if (typeof example === 'string') return example;
    const form = new URLSearchParams();
    for (const [name, value] of Object.entries(example ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) {
        form.append(
          name,
          typeof item === 'object' ? JSON.stringify(item) : String(item),
        );
      }
    }
    return form.toString();
  }
  if (!type.includes('json') && typeof example === 'string') return example;
  return JSON.stringify(example, null, 2);
}
export function parameterValue(
  document: OpenAPIDocument,
  parameter: Parameter,
  text: string,
): unknown {
  const schema = resolveRef(document, parameter.schema ?? {});
  if (
    schema.type === 'object' ||
    schema.type === 'array' ||
    schema.properties ||
    schema.items
  )
    return JSON.parse(text);
  return text;
}
export interface RequestInput {
  server: string;
  values: Record<string, string>;
  auth: Record<string, string>;
  securityIndex: number;
  body: string;
  mediaType: string;
}
export interface PreparedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function simple(value: unknown, explode: boolean): string {
  if (Array.isArray(value)) return value.map(String).join(',');
  if (value && typeof value === 'object')
    return Object.entries(value)
      .map(([key, item]) => (explode ? `${key}=${item}` : `${key},${item}`))
      .join(',');
  return String(value);
}
export function prepareRequest(
  document: OpenAPIDocument,
  data: OperationData,
  input: RequestInput,
): PreparedRequest {
  let path = data.path;
  const query = new URLSearchParams();
  const headers: Record<string, string> = {};
  for (const parameter of data.parameters) {
    const text = input.values[`${parameter.in}:${parameter.name}`];
    if (text === undefined || text === '') {
      if (parameter.required || parameter.in === 'path')
        throw new Error(`Enter ${parameter.in} parameter "${parameter.name}".`);
      continue;
    }
    const value = parameterValue(document, parameter, text);
    const style =
      parameter.style ??
      (parameter.in === 'query' || parameter.in === 'cookie'
        ? 'form'
        : 'simple');
    const explode = parameter.explode ?? style === 'form';
    if (parameter.in === 'cookie')
      throw new Error(
        'Browsers cannot set Cookie headers. Use the generated example in an HTTP client.',
      );
    if (parameter.in === 'path') {
      if (style !== 'simple')
        throw new Error(
          `Path style "${style}" is not supported by the playground.`,
        );
      const encoded = Array.isArray(value)
        ? value.map(item => encodeURIComponent(String(item))).join(',')
        : value && typeof value === 'object'
          ? Object.entries(value)
              .map(
                ([key, item]) =>
                  `${encodeURIComponent(key)}${explode ? '=' : ','}${encodeURIComponent(String(item))}`,
              )
              .join(',')
          : encodeURIComponent(String(value));
      path = path.split(`{${parameter.name}}`).join(encoded);
    } else if (parameter.in === 'header')
      headers[parameter.name] = simple(value, explode);
    else if (
      style === 'deepObject' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      for (const [key, item] of Object.entries(value))
        query.append(`${parameter.name}[${key}]`, String(item));
    } else if (style === 'form') {
      if (Array.isArray(value) && explode)
        for (const item of value) query.append(parameter.name, String(item));
      else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        explode
      )
        for (const [key, item] of Object.entries(value))
          query.append(key, String(item));
      else query.append(parameter.name, simple(value, false));
    } else if (
      (style === 'spaceDelimited' || style === 'pipeDelimited') &&
      Array.isArray(value)
    )
      query.append(
        parameter.name,
        value.join(style === 'spaceDelimited' ? ' ' : '|'),
      );
    else
      throw new Error(
        `Query style "${style}" is not supported by the playground.`,
      );
  }
  const requirements = data.security[input.securityIndex] ?? {};
  for (const name of Object.keys(requirements)) {
    const raw = document.components?.securitySchemes?.[name];
    if (!raw) throw new Error(`Missing security scheme: ${name}`);
    const scheme = resolveRef(document, raw);
    const value = input.auth[name];
    if (!value) throw new Error(`Enter credentials for ${name}.`);
    if (
      (scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'bearer') ||
      scheme.type === 'oauth2' ||
      scheme.type === 'openIdConnect'
    )
      headers.Authorization = `Bearer ${value}`;
    else if (scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'basic')
      headers.Authorization = `Basic ${btoa(value)}`;
    else if (scheme.type === 'apiKey' && scheme.name && scheme.in === 'header')
      headers[scheme.name] = value;
    else if (scheme.type === 'apiKey' && scheme.name && scheme.in === 'query')
      query.append(scheme.name, value);
    else
      throw new Error(
        `Security scheme ${name} is not supported by the browser playground.`,
      );
  }
  if (/\{[^}]+\}/.test(path) || /\{[^}]+\}/.test(input.server))
    throw new Error('Fill all path and server variables.');
  if (!input.server.trim()) throw new Error('Enter a server URL.');
  const url = `${input.server.replace(/\/$/, '')}${path}`;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url) && !/^https?:\/\//i.test(url))
    throw new Error('Only HTTP and HTTPS servers are supported.');
  let body: string | undefined;
  if (input.body && data.method !== 'get' && data.method !== 'head') {
    const type = input.mediaType.split(';')[0].trim().toLowerCase();
    if (type.includes('json')) JSON.parse(input.body);
    else if (
      type !== 'text/plain' &&
      type !== 'application/x-www-form-urlencoded'
    )
      throw new Error(
        `Request content type ${input.mediaType} is not supported by the playground.`,
      );
    headers['Content-Type'] = input.mediaType;
    body = input.body;
  }
  const requestBody =
    data.operation.requestBody &&
    resolveRef(document, data.operation.requestBody);
  if (requestBody?.required && !body) throw new Error('Enter a request body.');
  return {
    url: `${url}${query.size ? `${url.includes('?') ? '&' : '?'}${query}` : ''}`,
    method: data.method.toUpperCase(),
    headers,
    body,
  };
}
