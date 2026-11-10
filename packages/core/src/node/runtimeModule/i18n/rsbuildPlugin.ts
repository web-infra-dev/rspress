import type { RsbuildPlugin } from '@rsbuild/core';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import type { PluginDriver } from '../../PluginDriver';
import { RuntimeModuleID } from '../types';

export const rsbuildPluginI18n = ({
  pluginDriver,
}: {
  pluginDriver: PluginDriver;
}): RsbuildPlugin[] => [
  {
    name: 'rspress:i18n',
    setup(api) {
      api.onBeforeDevCompile(({ isFirstCompile }) => {
        // Rspress hooks can read i18n before Rsbuild's initial compilation.
        if (!isFirstCompile) {
          pluginDriver.invalidateI18nData();
        }
      });
    },
  },
  pluginVirtualModule({
    tempDir: '.rspress/runtime',
    virtualModules: {
      [RuntimeModuleID.I18nText]: async context => {
        const data = await pluginDriver.getI18nData(context);
        return `export default ${JSON.stringify(data, null, 2)}`;
      },
    },
  }),
];
