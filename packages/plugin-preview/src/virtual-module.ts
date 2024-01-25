import RspackVirtualModulePlugin from 'rspack-plugin-virtual-module';

export const demoRuntimeModule = new RspackVirtualModulePlugin({
  'virtual-meta': 'export const demos = []',
});
