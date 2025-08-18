import { RuntimeModuleID, type VirtualModulePlugin } from '../types';
import { createSiteData } from './createSiteData';

export const siteDataVMPlugin: VirtualModulePlugin = context => {
  const { config } = context;
  return {
    [RuntimeModuleID.SiteData]: async () => {
      const { siteData } = await createSiteData(config);
      return `export default ${JSON.stringify(siteData, null, 2)}`;
    },
  };
};
