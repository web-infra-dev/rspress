import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { RsbuildConfig } from '@rsbuild/core';
import { afterEach, beforeEach, expect, it, rs } from '@rstest/core';
import { normalizeConfigResult } from '../config/loadConfigFile';
import { initRsbuild } from './initRsbuild';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';

let directory: string;

beforeEach(async () => {
  rs.stubEnv('NODE_ENV', 'production');
  directory = await mkdtemp(path.join(tmpdir(), 'rspress-runtime-mode-'));
  await writeFile(path.join(directory, 'index.md'), '# Runtime mode');
});

afterEach(async () => {
  rs.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

async function getConfigs(builderConfig?: RsbuildConfig) {
  const driver = await PluginDriver.create(
    { root: directory, builderConfig },
    true,
  );
  const config = await driver.modifyConfig();
  const routeService = await RouteService.create({
    scanDir: directory,
    config,
    externalPages: [],
  });
  const rsbuild = await initRsbuild(
    directory,
    normalizeConfigResult(config),
    driver,
    routeService,
    true,
  );
  return rsbuild.initConfigs();
}

it('uses the Rspack runtime for client, HTML, and Markdown compilations', async () => {
  const configs = await getConfigs();
  expect(configs.map(config => config.name)).toEqual([
    'web',
    'node',
    'node_md',
  ]);
  expect(configs.map(config => config.experiments?.runtimeMode)).toEqual([
    'rspack',
    'rspack',
    'rspack',
  ]);
});

it('allows a shared runtime override', async () => {
  const configs = await getConfigs({
    tools: { rspack: { experiments: { runtimeMode: 'webpack' } } },
  });
  expect(configs.map(config => config.experiments?.runtimeMode)).toEqual([
    'webpack',
    'webpack',
    'webpack',
  ]);
});

it('allows an environment-specific runtime override', async () => {
  const configs = await getConfigs({
    environments: {
      web: {
        tools: { rspack: { experiments: { runtimeMode: 'webpack' } } },
      },
    },
  });
  expect(configs.map(config => config.experiments?.runtimeMode)).toEqual([
    'webpack',
    'rspack',
    'rspack',
  ]);
});
