import type { RspressPlugin } from '@rspress/shared';
import { execa } from 'execa';

function transform(timestamp: number, lang: string) {
  return new Date(timestamp).toLocaleString(lang || 'zh');
}

async function getGitLastUpdatedTimeStamp(filePath: string) {
  let lastUpdated;
  try {
    const { stdout } = await execa('git', [
      'log',
      '-1',
      '--format=%at',
      filePath,
    ]);
    lastUpdated = Number(stdout) * 1000;
  } catch (_e) {
    /* noop */
  }
  return lastUpdated;
}

/**
 * The plugin is used to add the last updated time to the page.
 */
export function pluginLastUpdated(): RspressPlugin {
  return {
    name: '@rspress/plugin-last-updated',
    async extendPageData(pageData) {
      const { _filepath, lang } = pageData;
      const lastUpdated = await getGitLastUpdatedTimeStamp(_filepath);
      if (lastUpdated) {
        // Property 'lastUpdatedTime' does not exist on type 'PageIndexInfo'.
        // @ts-ignore
        pageData.lastUpdatedTime = transform(lastUpdated, lang);
      }
    },
  };
}
