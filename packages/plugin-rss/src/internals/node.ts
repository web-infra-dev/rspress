import { promises } from 'node:fs';
import * as NodePath from 'node:path';

export async function writeFile(
  path: string,
  content: Parameters<typeof promises.writeFile>[1],
) {
  const dir = NodePath.dirname(path);
  await promises.mkdir(dir, { mode: 0o755, recursive: true });
  return promises.writeFile(path, content);
}

export async function readFile(path: string): Promise<string | null> {
  try {
    return await promises.readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Convert routePath to HTML file path
 * e.g. '/blog/foo/' -> 'blog/foo/index.html'
 * e.g. '/blog/foo' -> 'blog/foo.html'
 */
export function routePathToHtmlPath(routePath: string): string {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.html`;
  } else {
    fileName = `${routePath}.html`;
  }
  return fileName.replace(/^\/+/, '');
}

/**
 * Extract content from HTML using regex to find .rspress-doc container
 * This extracts the innerHTML of the element with class "rspress-doc"
 */
export function extractHtmlContent(html: string): string | null {
  // Match the content inside <div class="rp-doc rspress-doc" ...>...</div>
  // The content ends before </div><footer or </div></main
  const match = html.match(
    /<div[^>]*class="[^"]*rspress-doc[^"]*"[^>]*>([\s\S]*?)<\/div>(?=<footer|<\/main)/,
  );
  if (match) {
    return match[1].trim();
  }

  // Fallback: try to find any element with rspress-doc class
  // Use a greedy approach but stop at common ending patterns
  const fallbackMatch = html.match(
    /<div[^>]*class="[^"]*rspress-doc[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  );
  if (fallbackMatch) {
    return fallbackMatch[1].trim();
  }

  return null;
}
