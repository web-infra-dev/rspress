const cache = new Map<string, string>();

const DEV_COPY_WARNING =
  'Warning: Markdown content is unavailable in development mode; run `rspress build` to use this feature.';

export async function getLlmsCopyContent(url: string): Promise<string> {
  if (import.meta.env.DEV) {
    console.warn(DEV_COPY_WARNING);
    return DEV_COPY_WARNING;
  }

  const cachedContent = cache.get(url);
  if (cachedContent !== undefined) {
    return cachedContent;
  }

  const content = await fetch(url).then(response => response.text());
  cache.set(url, content);
  return content;
}
