import fs from 'node:fs/promises';
import path from 'node:path';
import { extractTextAndId, loadFrontMatter } from '@rspress/shared/node-utils';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

export async function extractInfoFromFrontmatterWithAbsolutePath(
  absolutePath: string,
  rootDir: string,
): Promise<{
  title: string;
  overviewHeaders: number[] | undefined;
  context: string | undefined;
  tag: string | undefined;
  description: string | undefined;
}> {
  const fileHandle = await fs.open(absolutePath, 'r');
  try {
    const buffer = Buffer.alloc(2048); // 2KB buffer
    let content = '';
    let bytesRead = 0;
    let hasFrontmatter = false;
    let frontmatterEnd = -1;
    let h1Match: RegExpMatchArray | null = null;
    let frontmatter: any = {};

    // Read file in chunks
    do {
      const result = await fileHandle.read(buffer, 0, buffer.length, bytesRead);
      if (result.bytesRead === 0) break;

      content += buffer.subarray(0, result.bytesRead).toString('utf-8');
      bytesRead += result.bytesRead;

      // Check for frontmatter on first chunk
      if (bytesRead <= buffer.length) {
        if (content.startsWith('---')) {
          hasFrontmatter = true;
          const secondDelimiter = content.indexOf('\n---\n', 4);
          if (secondDelimiter !== -1) {
            frontmatterEnd = secondDelimiter + 5;
            const { frontmatter: fm } = loadFrontMatter(
              content.slice(0, frontmatterEnd + 100),
              absolutePath,
              rootDir,
            );
            frontmatter = fm;
          }
        } else {
          hasFrontmatter = false;
        }
      }

      // Look for h1 header
      if (!h1Match) {
        const searchStart =
          hasFrontmatter && frontmatterEnd > -1 ? frontmatterEnd : 0;
        const h1RegExp = /^#\s+(.*?)\n$/m;
        h1Match = content.slice(searchStart).match(h1RegExp);
      }

      // For Perf, early return conditions
      if (hasFrontmatter && frontmatterEnd > -1 && h1Match) {
        // Found both frontmatter and h1
        break;
      }
      if (!hasFrontmatter && h1Match) {
        // No frontmatter but found h1
        break;
      }
      if (hasFrontmatter && frontmatterEnd > -1 && bytesRead > 16384) {
        // Found frontmatter but no h1 after reasonable search
        break;
      }
    } while (bytesRead < 65536); // Max 64KB search limit

    // If we still don't have frontmatter but expected it, parse what we have
    if (hasFrontmatter && frontmatterEnd === -1) {
      const { frontmatter: fm } = loadFrontMatter(
        content,
        absolutePath,
        rootDir,
      );
      frontmatter = fm;
    }

    if (!h1Match) {
      const h1RegExp = /^#\s+(.*)$/m;
      h1Match = content.match(h1RegExp);
    }

    const fileNameWithoutExt = path.basename(
      absolutePath,
      path.extname(absolutePath),
    );

    return {
      title: extractTextAndId(
        frontmatter.title || h1Match?.[1] || fileNameWithoutExt,
      )[0],
      overviewHeaders: frontmatter.overviewHeaders,
      context: frontmatter.context,
      tag: frontmatter.tag,
      description: frontmatter.description,
    };
  } finally {
    await fileHandle.close();
  }
}
