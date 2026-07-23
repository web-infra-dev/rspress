import path from 'node:path';
import type { LastUpdatedAuthor, RspressPlugin } from '@rspress/shared';
import { execa } from 'execa';
import { slash } from '../utils';

function transform(timestamp: number, lang: string) {
  return new Date(timestamp).toLocaleString(lang || 'zh');
}

interface GitInfo {
  timestamp: number;
  authorName: string;
  authorEmail: string;
}

type GitInfoLookup = (filePath: string) => GitInfo | undefined;

/**
 * A commit is printed as `\0<author date>\0<author name>\0<author email>`, so a
 * header line can never be mistaken for one of the file paths that follow it.
 */
const COMMIT_FORMAT = '--pretty=format:%x00%at%x00%an%x00%ae';

const ESCAPES: Record<string, string> = {
  a: '\x07',
  b: '\b',
  t: '\t',
  n: '\n',
  v: '\v',
  f: '\f',
  r: '\r',
  '"': '"',
  '\\': '\\',
};

/**
 * `git` wraps paths containing a control character, a quote or a backslash in
 * double quotes and escapes them C-style. Non-ASCII bytes are left as they are
 * thanks to `core.quotePath=false`, so an escape is always a single character.
 */
function unquotePath(filePath: string): string {
  if (!filePath.startsWith('"')) {
    return filePath;
  }
  return filePath
    .slice(1, -1)
    .replace(/\\([0-7]{3}|.)/g, (_, escaped: string) =>
      escaped.length === 3
        ? String.fromCharCode(Number.parseInt(escaped, 8))
        : (ESCAPES[escaped] ?? escaped),
    );
}

/**
 * The deepest directory containing every file, used to scope the `git log`
 * walk. Pages living outside of the doc root widen it, up to the repository.
 */
function getCommonDir(filePaths: string[]): string {
  let common = path.dirname(filePaths[0]).split(path.sep);
  for (const filePath of filePaths.slice(1)) {
    const segments = path.dirname(filePath).split(path.sep);
    let i = 0;
    while (
      i < common.length &&
      i < segments.length &&
      common[i] === segments[i]
    ) {
      i++;
    }
    common = common.slice(0, i);
  }
  return common.join(path.sep) || path.sep;
}

/**
 * Read the last commit of every file below `dir` with a single `git` process.
 */
async function collectGitInfo(dir: string): Promise<Map<string, GitInfo>> {
  const infoByPath = new Map<string, GitInfo>();

  let stdout: string;
  try {
    ({ stdout } = await execa(
      'git',
      [
        '-c',
        'core.quotePath=false',
        'log',
        COMMIT_FORMAT,
        '--name-only',
        // Only the touched paths matter, similarity detection is wasted work.
        '--no-renames',
        // Print paths relative to `dir` and skip everything outside of it.
        '--relative',
        '--',
        '.',
      ],
      { cwd: dir },
    ));
  } catch (_e) {
    return infoByPath;
  }

  let commit: GitInfo | undefined;
  for (const line of stdout.split('\n')) {
    if (line.startsWith('\0')) {
      const [, at, an = '', ae = ''] = line.split('\0');
      commit = {
        timestamp: Number(at) * 1000,
        authorName: an,
        authorEmail: ae,
      };
      continue;
    }
    if (!line || !commit) {
      continue;
    }
    const filePath = unquotePath(line);
    // Commits are listed newest first, so the first entry of a path wins.
    if (!infoByPath.has(filePath)) {
      infoByPath.set(filePath, commit);
    }
  }

  return infoByPath;
}

async function createLookup(filePaths: string[]): Promise<GitInfoLookup> {
  if (!filePaths.length) {
    return () => undefined;
  }
  const dir = getCommonDir(filePaths);
  const infoByPath = await collectGitInfo(dir);
  return filePath => infoByPath.get(slash(path.relative(dir, filePath)));
}

/**
 * The plugin is used to add the last updated time and author to the page.
 */
export function pluginLastUpdated(
  authorOption: LastUpdatedAuthor = false,
): RspressPlugin {
  let lookup: Promise<GitInfoLookup> | undefined;

  return {
    name: '@rspress/plugin-last-updated',
    // Routes are known long before the page data is created, so the whole site
    // is read by a single `git log` process instead of one process per page,
    // running while the rest of the build is still warming up.
    routeGenerated(routes) {
      lookup = createLookup(routes.map(route => route.absolutePath));
    },
    async extendPageData(pageData) {
      const { _filepath, lang } = pageData;
      const info = (await lookup)?.(_filepath);
      if (!info) return;
      // Property does not exist on type 'PageIndexInfo'.
      // @ts-expect-error
      pageData.lastUpdatedTime = transform(info.timestamp, lang);
      if (authorOption === false) return;
      const display =
        typeof authorOption === 'function'
          ? authorOption({
              name: info.authorName,
              email: info.authorEmail,
              filePath: _filepath,
            })
          : info.authorName;
      // @ts-expect-error see types/index.ts
      pageData.lastUpdatedAuthor = display;
    },
  };
}
