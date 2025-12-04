import path, { join } from 'node:path';
// Rslib(Rspack) will optimize the json module, the only one point that we need to concern is to bump the package.json version first then run build command
import { version } from '@rspress/core/package.json';
import { logger } from '@rspress/shared/logger';
import { cac } from 'cac';
import chokidar from 'chokidar';
import picocolors from 'picocolors';
import { PUBLIC_DIR } from '../node/constants';
import { ejectComponent, listComponents } from '../node/eject';
import { build, dev, serve } from '../node/index';
import { loadConfigFile, resolveDocRoot } from './config/loadConfigFile';

const META_FILES = ['_meta.json', '_nav.json'];

const cli = cac('rspress').version(version).help();

const landingMessage = `🔥 Rspress v${version}\n`;
logger.greet(landingMessage);

const setNodeEnv = (env: 'development' | 'production') => {
  process.env.NODE_ENV = env;
};

cli.option('-c,--config [config]', 'Specify the path to the config file');

cli
  .command('[root]', 'start dev server') // default command
  .alias('dev')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(
    async (
      root,
      options?: { port?: number; host?: string; config?: string },
    ) => {
      setNodeEnv('development');
      let isRestarting = false;
      const cwd = process.cwd();
      let cliWatcher: chokidar.FSWatcher;
      let devServer: Awaited<ReturnType<typeof dev>>;
      const startDevServer = async () => {
        const { port, host } = options || {};
        const { config, configFilePath } = await loadConfigFile(
          options?.config,
        );

        config.root = resolveDocRoot(cwd, root, config.root);

        const docDirectory = config.root;

        devServer = await dev({
          appDirectory: cwd,
          docDirectory,
          config,
          configFilePath,
          extraBuilderConfig: { server: { port, host } },
        });

        cliWatcher = chokidar.watch([configFilePath, docDirectory], {
          ignoreInitial: true,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/.DS_Store/**',
            // ignore public folder in dev, these files are handled by server middleware
            join(docDirectory, PUBLIC_DIR),
          ],
        });
        cliWatcher.on('all', async (eventName, filepath) => {
          const basename = path.basename(filepath);
          if (eventName === 'change' && META_FILES.includes(basename)) {
            return;
          }

          if (
            eventName === 'add' ||
            eventName === 'unlink' ||
            (eventName === 'change' && filepath === configFilePath)
          ) {
            if (isRestarting) {
              return;
            }

            isRestarting = true;
            console.log(
              `\n✨ ${eventName} ${picocolors.green(
                path.relative(cwd, filepath),
              )}, dev server will restart...\n`,
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
    },
  );

cli.command('build [root]').action(async (root, options) => {
  setNodeEnv('production');
  const cwd = process.cwd();
  const { config, configFilePath } = await loadConfigFile(options.config);

  config.root = resolveDocRoot(cwd, root, config.root);
  const docDirectory = config.root;

  try {
    await build({
      docDirectory,
      config,
      configFilePath,
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
});

cli
  .command('preview [root]')
  .alias('serve')
  .option('--port [port]', 'port number')
  .option('--host [host]', 'hostname')
  .action(
    async (
      root,
      options?: { port?: number; host?: string; config?: string },
    ) => {
      setNodeEnv('production');
      const cwd = process.cwd();
      const { port, host } = options || {};
      const { config, configFilePath } = await loadConfigFile(options?.config);

      config.root = resolveDocRoot(cwd, root, config.root);

      await serve({
        config,
        host,
        port,
        configFilePath,
      });
    },
  );

cli
  .command('eject [component]', 'Eject a theme component to customize it')
  .action(async (component?: string) => {
    if (!component) {
      await listComponents();
      return;
    }

    const cwd = process.cwd();
    try {
      await ejectComponent(component, cwd);
    } catch (error) {
      logger.error(`Failed to eject component: ${error}`);
      process.exit(1);
    }
  });

cli.parse();
