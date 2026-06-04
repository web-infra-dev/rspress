import type { LastUpdatedAuthor, RspressPlugin } from '@rspress/shared';
import { execa } from 'execa';

function transform(timestamp: number, lang: string) {
  return new Date(timestamp).toLocaleString(lang || 'zh');
}

interface GitInfo {
  timestamp: number;
  authorName: string;
  authorEmail: string;
}

async function getGitInfo(filePath: string): Promise<GitInfo | undefined> {
  try {
    const { stdout } = await execa('git', [
      'log',
      '-1',
      '--format=%at%n%an%n%ae',
      '--',
      filePath,
    ]);
    const [at, an, ae] = stdout.split('\n');
    if (!at) return undefined;
    return {
      timestamp: Number(at) * 1000,
      authorName: an ?? '',
      authorEmail: ae ?? '',
    };
  } catch (_e) {
    return undefined;
  }
}

/**
 * The plugin is used to add the last updated time and author to the page.
 */
export function pluginLastUpdated(
  authorOption: LastUpdatedAuthor = false,
): RspressPlugin {
  return {
    name: '@rspress/plugin-last-updated',
    async extendPageData(pageData) {
      const { _filepath, lang } = pageData;
      const info = await getGitInfo(_filepath);
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
