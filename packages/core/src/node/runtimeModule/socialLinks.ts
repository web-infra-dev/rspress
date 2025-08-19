import { getSocialIcons } from '../utils/getSocialIcons';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

export const socialLinksVMPlugin: VirtualModulePlugin = context => {
  const { config } = context;
  return {
    [RuntimeModuleID.socialLinks]: () => {
      return `export default ${JSON.stringify(getSocialIcons(config.themeConfig?.socialLinks), null, 2)}`;
    },
  };
};
