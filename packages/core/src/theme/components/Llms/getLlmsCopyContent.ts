const cache = new Map<string, string>();

export const DEV_COPY_WARNING =
  'Warning: Markdown content is unavailable in development mode; run `rspress build` to use this feature.';

export async function getLlmsCopyContent(
  url: string,
  isDev: boolean,
): Promise<string> {
  if (isDev) {
    console.warn(DEV_COPY_WARNING);
    return DEV_COPY_WARNING;
  }

  const content =
    cache.get(url) ?? (await fetch(url).then(response => response.text()));
  cache.set(url, content);
  return content;
}
