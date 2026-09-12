// cspell:ignore snippetz nethttp httpclient reqwest
import { shellCurl } from '@scalar/snippetz/plugins/shell/curl';
import { jsFetch } from '@scalar/snippetz/plugins/js/fetch';
import { pythonRequests } from '@scalar/snippetz/plugins/python/requests';
import { goNative } from '@scalar/snippetz/plugins/go/native';
import { javaNethttp } from '@scalar/snippetz/plugins/java/nethttp';
import { csharpHttpclient } from '@scalar/snippetz/plugins/csharp/httpclient';
import { rustReqwest } from '@scalar/snippetz/plugins/rust/reqwest';
import { resolveRef } from '../model';
import type { OpenAPIDocument, OperationData } from '../types';
import {
  prepareRequest,
  type PreparedRequest,
  type RequestInput,
} from './request';

/** Placeholder credentials belong only to examples, never to Send. */
export function prepareExampleRequest(
  document: OpenAPIDocument,
  data: OperationData,
  input: RequestInput,
): PreparedRequest {
  const auth = { ...input.auth };
  for (const name of Object.keys(data.security[input.securityIndex] ?? {})) {
    if (auth[name]) continue;
    const raw = document.components?.securitySchemes?.[name];
    if (!raw) continue;
    const scheme = resolveRef(document, raw);
    auth[name] =
      scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'basic'
        ? 'username:password'
        : scheme.type === 'apiKey'
          ? 'YOUR_API_KEY'
          : 'YOUR_ACCESS_TOKEN';
  }
  return prepareRequest(document, data, { ...input, auth });
}

export type Language =
  'cURL' | 'JavaScript' | 'Go' | 'Python' | 'Java' | 'C#' | 'Rust';
const generators: Record<Language, typeof shellCurl> = {
  cURL: shellCurl,
  JavaScript: jsFetch,
  Go: goNative,
  Python: pythonRequests,
  Java: javaNethttp,
  'C#': csharpHttpclient,
  Rust: rustReqwest,
};
export const languages = Object.keys(generators) as Language[];
export function generateSnippet(
  request: PreparedRequest,
  language: Language,
): string {
  return generators[language].generate({
    url: request.url,
    method: request.method,
    headers: Object.entries(request.headers).map(([name, value]) => ({
      name,
      value,
    })),
    ...(request.body === undefined
      ? {}
      : {
          postData: {
            mimeType: request.headers['Content-Type'] ?? 'text/plain',
            text: request.body,
          },
        }),
  });
}
