import { createRequire } from 'module';
import path from 'path';
import { cac } from 'cac';
import { build, dev, serve } from '@rspress/core';
import chokidar from 'chokidar';
import chalk from 'chalk';
import { loadConfigFile } from './config/loadConfigFile';

const CONFIG_FILES = ['rspress.config.ts', 'rspress.config.js', '_meta.json'];

const require = createRequire(import.meta.url);
// eslint-disable-next-line import/no-commonjs
const gradient = require('gradient-string');

// eslint-disable-next-line import/no-commonjs
const packageJson = require('../package.json');

const cli = cac('rspress').version(packageJson.version).help();

const landingMessage = `🔥 Rspress v${packageJson.version}\n`;
const rainbowMessage = gradient.cristal(landingMessage);
console.log(chalk.bold(rainbowMessage));

const setNodeEnv = (env: 'development' | 'production') => {
  process.env.NODE_ENV = env;
};

cli.option('--config [config]', 'Specify the path to the config file');

cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .action(async (root, options) => {
    setNodeEnv('development');

    const cwd = process.cwd();
    let docDirectory: string;
    let cliWatcher: chokidar.FSWatcher;
    let devServer: Awaited<ReturnType<typeof dev>>;

    const startDevServer = async () => {
      const config = await loadConfigFile(options.config);
      docDirectory = config.root || path.join(cwd, root ?? 'docs');
      devServer = await dev({
        appDirectory: cwd,
        docDirectory,
        config,
      });
      cliWatcher = chokidar.watch(
        [`${cwd}/**/{${CONFIG_FILES.join(',')}}`, docDirectory!],
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
            CONFIG_FILES.includes(path.basename(filepath)))
        ) {
          console.log(
            `\n✨ ${eventName} ${chalk.green(
              path.relative(cwd, filepath),
            )}, dev server will restart...\n`,
          );
          await devServer.close();
          await cliWatcher.close();
          await startDevServer();
        }
      });
    };

    await startDevServer();

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
    setNodeEnv('production');
    const cwd = process.cwd();
    const config = await loadConfigFile(options.config);
    await build({
      appDirectory: cwd,
      docDirectory: config.root || path.join(cwd, root ?? 'docs'),
      config,
    });
  });

cli
  .command('preview')
  .alias('serve')
  .option('-c --config <config>', 'specify config file')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(
    async (options?: { port?: number; host?: string; config?: string }) => {
      setNodeEnv('production');
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
