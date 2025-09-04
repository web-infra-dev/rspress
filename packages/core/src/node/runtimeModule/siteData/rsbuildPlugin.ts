import { modifyConfigWithAutoNavSide } from '../../auto-nav-sidebar';
import { RuntimeModuleID, type VirtualModulePlugin } from '../types';
import { createSiteData } from './createSiteData';

export const siteDataVMPlugin: VirtualModulePlugin = context => {
  const { config, pluginDriver } = context;
  return {
    [RuntimeModuleID.SiteData]: async ({ addDependency }) => {
      const force = !pluginDriver.haveNavSidebarConfig;
      const metaFileSet = new Set<string>();
      try {
        await modifyConfigWithAutoNavSide(config, metaFileSet, force);
      } finally {
        if (metaFileSet) {
          for (const metaFile of metaFileSet) {
            addDependency(metaFile);
          }
        }
      }

      const { siteData } = await createSiteData(config);
      return `export default ${JSON.stringify(siteData, null, 2)}`;
    },
  };
};
