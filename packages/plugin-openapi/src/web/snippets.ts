import { shellCurl } from '@scalar/snippetz/plugins/shell/curl';
import { jsFetch } from '@scalar/snippetz/plugins/js/fetch';
import { pythonRequests } from '@scalar/snippetz/plugins/python/requests';
import { goNative } from '@scalar/snippetz/plugins/go/native';
import { javaNethttp } from '@scalar/snippetz/plugins/java/nethttp';
import { csharpHttpclient } from '@scalar/snippetz/plugins/csharp/httpclient';
import { rustReqwest } from '@scalar/snippetz/plugins/rust/reqwest';
import type { PreparedRequest } from './request';

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
