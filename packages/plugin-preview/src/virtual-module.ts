import RspackVirtualModulePlugin from 'rspack-plugin-virtual-module';
import type { DemoInfo } from './types';

export const demos: DemoInfo = {};

export const demoRuntimeModule = new RspackVirtualModulePlugin({
  'virtual-meta': 'export const demos = {}',
});
