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
  // A collapsed prefix is the filesystem root, spelled `C:\` and not `C:` on
  // Windows so it stays usable as a `cwd`.
  return common.length > 1
    ? common.join(path.sep)
    : path.parse(filePaths[0]).root;
}

/**
 * The directory holding the largest number of files, which is inside the git
 * repository even when stray pages have pushed the common directory out of it.
 */
function getMostCommonParent(filePaths: string[]): string {
  const counts = new Map<string, number>();
  let best = '';
  let bestCount = 0;
  for (const filePath of filePaths) {
    const dir = path.dirname(filePath);
    const count = (counts.get(dir) ?? 0) + 1;
    counts.set(dir, count);
    if (count > bestCount) {
      best = dir;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Where `dir` sits inside its repository, as `docs/guide/` — or `undefined`
 * outside of any repository. Unlike `--show-toplevel` the prefix contains no
 * absolute path, so it cannot disagree with the caller about symlinks.
 */
async function getRepoPrefix(dir: string): Promise<string | undefined> {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--show-prefix'], {
      cwd: dir,
    });
    return stdout.trim();
  } catch (_e) {
    return undefined;
  }
}

/**
 * `dir` with the final `prefix` segments removed: the repository root spelled
 * the way the caller spells `dir`.
 */
function stripPrefix(dir: string, prefix: string): string {
  let root = dir;
  for (let i = prefix.split('/').filter(Boolean).length; i > 0; i--) {
    root = path.dirname(root);
  }
  return root;
}

/**
 * Read the last commit of every file below `dir` with a single `git` process.
 * The returned map is keyed by path relative to the repository root — the form
 * git prints throughout, `--relative` being ignored by `--cc` output.
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
        // A merge commit only lists the files its conflict resolution touched,
        // which are the ones `git log -1 -- <file>` attributes to the merge.
        '--cc',
        // Only the touched paths matter, similarity detection is wasted work.
        '--no-renames',
        // Skip commits not touching anything below `dir`.
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
  let dir = getCommonDir(filePaths);
  let prefix = await getRepoPrefix(dir);
  if (prefix === undefined) {
    // `addPages` may contribute pages living outside of the repository, moving
    // the common directory above it. Retry from the repository holding the
    // bulk of the pages, walking it from its root.
    const candidate = getMostCommonParent(filePaths);
    const candidatePrefix = await getRepoPrefix(candidate);
    if (candidatePrefix === undefined) {
      return () => undefined;
    }
    dir = stripPrefix(candidate, candidatePrefix);
    prefix = '';
  }
  const repoPrefix = prefix;
  const scope = dir;
  const infoByPath = await collectGitInfo(dir);
  return filePath =>
    infoByPath.get(repoPrefix + slash(path.relative(scope, filePath)));
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
