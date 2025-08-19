import { getSocialIcons } from '../utils/getSocialIcons';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

/**
 * Generate i18n text for client runtime
 */
export const i18nVMPlugin: VirtualModulePlugin = context => {
  const { config } = context;
  return {
    [RuntimeModuleID.socialLinks]: () => {
      return `export default ${JSON.stringify(getSocialIcons(config.themeConfig?.socialLinks), null, 2)}`;
    },
  };
};
