import { createRequire } from 'module';
import path from 'path';
import { cac } from 'cac';
import { UserConfig, build, dev, serve } from '@rspress/core';
import { loadConfigFile } from './config/loadConfigFile';

const require = createRequire(import.meta.url);

// eslint-disable-next-line import/no-commonjs
const packageJson = require('../package.json');

const cli = cac('rspress').version(packageJson.version).help();

cli.option('--config [config]', 'Specify the path to the config file');

cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .action(async (root, options) => {
    const cwd = process.cwd();
    const config = await loadConfigFile(options.config);
    await dev({
      appDirectory: cwd,
      docDirectory: config.root || path.join(cwd, root ?? 'docs'),
      config,
    });
  });

cli
  .command('build [root]')
  .option('-c --config <config>', 'specify config file')
  .action(async (root, options) => {
    const cwd = process.cwd();
    const config = await loadConfigFile(options.config);
    await build({
      appDirectory: cwd,
      docDirectory: config.root || path.join(cwd, root ?? 'docs'),
      config,
    });
  });

cli
  .command('preview [root]')
  .alias('serve')
  .option('-c --config <config>', 'specify config file')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(
    async (options?: { port?: number; host?: string; config?: string }) => {
      const { port, host } = options || {};
      const config = await loadConfigFile(options?.config);

      await serve({
        config,
        host,
        port,
      });
    },
  );

cli.parse();

export function defineConfig(config: UserConfig): UserConfig {
  return config;
}
