import { createRequire } from 'node:module';
import path from 'node:path';
import { cac } from 'cac';
import { build, dev, serve } from '@rspress/core';
import { logger } from '@rspress/shared/logger';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { loadConfigFile, resolveDocRoot } from './config/loadConfigFile';
import update from './update';
const CONFIG_FILES = ['rspress.config.ts', 'rspress.config.js', 'i18n.json'];
const META_FILE = '_meta.json';
const require = createRequire(import.meta.url);
// eslint-disable-next-line import/no-commonjs
const packageJson = require('../package.json');
const cli = cac('rspress').version(packageJson.version).help();
const landingMessage = `🔥 Rspress v${packageJson.version}\n`;
logger.greet(landingMessage);
const setNodeEnv = env => {
  process.env.NODE_ENV = env;
};
cli.option('-c,--config [config]', 'Specify the path to the config file');
cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(async (root, options) => {
    setNodeEnv('development');
    let isRestarting = false;
    const cwd = process.cwd();
    let cliWatcher;
    let devServer;
    const startDevServer = async () => {
      const { port, host } = options || {};
      const config = await loadConfigFile(options?.config);
      config.root = resolveDocRoot(cwd, root, config.root);
      const docDirectory = config.root;
      devServer = await dev({
        appDirectory: cwd,
        docDirectory,
        config,
        extraBuilderConfig: { server: { port, host } },
      });
      cliWatcher = chokidar.watch(
        [`${cwd}/**/{${CONFIG_FILES.join(',')}}`, docDirectory],
        {
          ignoreInitial: true,
          ignored: ['**/node_modules/**', '**/.git/**', '**/.DS_Store/**'],
        },
      );
      cliWatcher.on('all', async (eventName, filepath) => {
        if (
          eventName === 'add' ||
          eventName === 'unlink' ||
          (eventName === 'change' &&
            (CONFIG_FILES.includes(path.basename(filepath)) ||
              path.basename(filepath) === META_FILE))
        ) {
          if (isRestarting) {
            return;
          }
          isRestarting = true;
          console.log(
            `\n✨ ${eventName} ${chalk.green(path.relative(cwd, filepath))}, dev server will restart...\n`,
          );
          await devServer.close();
          await cliWatcher.close();
          await startDevServer();
          isRestarting = false;
        }
      });
    };
    await startDevServer();
    const exitProcess = async () => {
      try {
        await devServer.close();
        await cliWatcher.close();
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGINT', exitProcess);
    process.on('SIGTERM', exitProcess);
  });
cli.command('build [root]').action(async (root, options) => {
  setNodeEnv('production');
  const cwd = process.cwd();
  const config = await loadConfigFile(options.config);
  config.root = resolveDocRoot(cwd, root, config.root);
  const docDirectory = config.root;
  await build({
    appDirectory: cwd,
    docDirectory,
    config,
  });
});
cli
  .command('preview [root]')
  .alias('serve')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(async (root, options) => {
    setNodeEnv('production');
    const cwd = process.cwd();
    const { port, host } = options || {};
    const config = await loadConfigFile(options?.config);
    config.root = resolveDocRoot(cwd, root, config.root);
    await serve({
      config,
      host,
      port,
    });
  });
cli.command('update', 'update relevant packages about rspress').action(update);
cli.parse();
