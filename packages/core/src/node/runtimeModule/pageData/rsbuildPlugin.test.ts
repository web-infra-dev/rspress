import {
  afterEach,
  beforeEach,
  describe,
  expect,
  rs,
  test,
} from '@rstest/core';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import { RuntimeModuleID } from '../types';
import { createPageData } from './createPageData';
import { rsbuildPluginDocVM } from './rsbuildPlugin';

rs.mock('rsbuild-plugin-virtual-module', () => ({
  pluginVirtualModule: rs.fn(() => ({ name: 'virtual-page-data' })),
}));

rs.mock('./createPageData', () => ({
  createPageData: rs.fn(),
}));

type ModifyBundlerChain = (
  chain: {
    resolve: { alias: { entries: () => Record<string, string> } };
  },
  context: { environment: { name: string } },
) => void | Promise<void>;

const pageDataResult = {
  filepaths: ['/docs/index.md'],
  pageData: { pages: [] },
  searchIndex: {},
  indexHashByGroup: {},
};

async function setupPlugin() {
  const plugins = await rsbuildPluginDocVM({
    config: {},
    userDocRoot: '/docs',
    routeService: {},
    pluginDriver: {},
  } as never);
  let modifyBundlerChainCallback: ModifyBundlerChain | undefined;
  const processAssets = rs.fn();
  await plugins[0].setup?.({
    modifyBundlerChain(callback: ModifyBundlerChain) {
      modifyBundlerChainCallback = callback;
    },
    processAssets,
  } as never);

  const virtualModuleOptions = rs
    .mocked(pluginVirtualModule)
    .mock.calls.at(-1)?.[0];
  const renderPageData =
    virtualModuleOptions?.virtualModules?.[RuntimeModuleID.PageData];
  if (!modifyBundlerChainCallback || typeof renderPageData !== 'function') {
    throw new Error('Failed to initialize page data plugins');
  }

  return {
    async configureEnvironment(name: string, alias: Record<string, string>) {
      await modifyBundlerChainCallback(
        { resolve: { alias: { entries: () => alias } } },
        { environment: { name } },
      );
      if (!processAssets.mock.calls.length) {
        throw new Error('Environment configuration callback did not run');
      }
    },
    renderPageData: () =>
      renderPageData({ addDependency: rs.fn() } as never, {} as never),
  };
}

describe('page data rsbuild plugin', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    rs.mocked(createPageData).mockResolvedValue(pageDataResult);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    rs.clearAllMocks();
  });

  test('uses the first environment alias until the web alias is available', async () => {
    const plugin = await setupPlugin();
    await plugin.configureEnvironment('node', { fallback: '/fallback' });

    await expect(plugin.renderPageData()).resolves.toContain('"pages": []');
    expect(createPageData).toHaveBeenLastCalledWith(
      expect.objectContaining({ alias: { fallback: '/fallback' } }),
    );

    await plugin.configureEnvironment('web', { web: '/web' });
    await plugin.renderPageData();
    expect(createPageData).toHaveBeenLastCalledWith(
      expect.objectContaining({ alias: { web: '/web' } }),
    );
  });

  test('caches production generation across compiler targets', async () => {
    process.env.NODE_ENV = 'production';
    const plugin = await setupPlugin();
    await plugin.configureEnvironment('web', { web: '/web' });

    await plugin.renderPageData();
    await plugin.renderPageData();

    expect(createPageData).toHaveBeenCalledTimes(1);
  });

  test('regenerates in development and deduplicates concurrent requests', async () => {
    const plugin = await setupPlugin();
    await plugin.configureEnvironment('web', { web: '/web' });

    await Promise.all([plugin.renderPageData(), plugin.renderPageData()]);
    expect(createPageData).toHaveBeenCalledTimes(1);

    await plugin.renderPageData();
    expect(createPageData).toHaveBeenCalledTimes(2);
  });

  test('retries a failed production generation', async () => {
    process.env.NODE_ENV = 'production';
    rs.mocked(createPageData)
      .mockRejectedValueOnce(new Error('generation failed'))
      .mockResolvedValueOnce(pageDataResult);
    const plugin = await setupPlugin();

    await expect(
      plugin.configureEnvironment('web', { web: '/web' }),
    ).rejects.toThrow('generation failed');
    await expect(plugin.renderPageData()).resolves.toContain('"pages": []');
    expect(createPageData).toHaveBeenCalledTimes(2);
  });
});
