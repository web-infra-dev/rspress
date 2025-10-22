import { logger } from '@rspress/shared/logger';
import { modifyConfigWithAutoNavSide } from '../../auto-nav-sidebar';
import { RuntimeModuleID, type VirtualModulePlugin } from '../types';
import { createSiteData } from './createSiteData';

export const siteDataVMPlugin: VirtualModulePlugin = context => {
  const { config, pluginDriver } = context;
  return {
    [RuntimeModuleID.SiteData]: async ({ addDependency }) => {
      const force = !pluginDriver.haveNavSidebarConfig;
      const metaFileSet = new Set<string>();
      const mdFileSet = new Set<string>();

      const now = performance.now();

      try {
        await modifyConfigWithAutoNavSide(
          config,
          metaFileSet,
          mdFileSet,
          force,
        );
      } finally {
        for (const metaFile of metaFileSet) {
          addDependency(metaFile);
        }
        // TODO: incremental
        // perf issue of add too much md files to dependencies, trigger auto-nav-sidebar too often
        for (const mdFile of mdFileSet) {
          addDependency(mdFile);
        }
        logger.debug(
          `modifyConfigWithAutoNavSide - size: ${mdFileSet.size} cost: ${performance.now() - now}ms`,
        );
      }

      const { siteData } = await createSiteData(config);
      return `export default ${JSON.stringify(siteData, null, 2)}`;
    },
  };
};
