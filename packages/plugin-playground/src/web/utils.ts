export function normalizeUrl(u: string) {
  return u.replace(/([^:]\/)\/+/g, '$1');
}
