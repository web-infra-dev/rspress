import { createRequire } from 'module';
import path from 'path';
import { cac } from 'cac';
import { build, dev, serve } from '@rspress/core';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { loadConfigFile } from './config/loadConfigFile';

const require = createRequire(import.meta.url);

const CONFIG_FILES = ['rspress.config.ts', 'rspress.config.js', '_meta.json'];

// eslint-disable-next-line import/no-commonjs
const packageJson = require('../package.json');

const cli = cac('rspress').version(packageJson.version).help();

cli.option('--config [config]', 'Specify the path to the config file');

cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .action(async (root, options) => {
    const cwd = process.cwd();
    const startDevServer = async () => {
      const config = await loadConfigFile(options.config);

      return dev({
        appDirectory: cwd,
        docDirectory: config.root || path.join(cwd, root ?? 'docs'),
        config,
      });
    };
    let devServer = await startDevServer();
    const cliWatcher = chokidar.watch(`${cwd}/**/{${CONFIG_FILES.join(',')}}`, {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**', '**/.DS_Store/**'],
    });

    cliWatcher.on('all', async (_eventName, filepath) => {
      await devServer.close();
      console.log(
        `${chalk.green(
          path.relative(cwd, filepath),
        )} has changed, dev server will restart...\n`,
      );
      devServer = await startDevServer();
    });

    const exitProcess = async () => {
      await cliWatcher.close();
      await devServer.close();
    };

    process.on('SIGINT', exitProcess);
    process.on('SIGTERM', exitProcess);
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
