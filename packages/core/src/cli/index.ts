import type { RestartFn } from '@rsbuild/core';
// Rslib(Rspack) will optimize the json module, the only one point that we need to concern is to bump the package.json version first then run build command
import { version } from '@rspress/core/package.json';
import { logger } from '@rspress/shared/logger';
import { cac } from 'cac';
import { loadConfigFile, resolveDocRoot } from '../config/loadConfigFile';
import { ejectComponent, listComponents } from '../node/eject';
import { build, dev, serve } from '../node/index';

export type RunCLIOptions = {
  /**
   * The command-line arguments to parse, matching the shape of Node.js `process.argv`
   * @default process.argv
   */
  argv?: string[];
};

const setNodeEnv = (env: 'development' | 'production') => {
  process.env.NODE_ENV = env;
};

export function runCLI({ argv = process.argv }: RunCLIOptions = {}): void {
  const cli = cac('rspress').version(version).help();

  const landingMessage = `🔥 Rspress v${version}\n`;
  logger.greet(landingMessage);

  cli.option(
    '-c, --config <config>',
    'Set the configuration file (relative or absolute path)',
  );

  cli
    .command('[root]', 'Start the dev server') // default command
    .alias('dev')
    .option('--port <port>', 'Set the port number for the server')
    .option('--host [host]', 'Set the host that the server listens to')
    .option('--base <base>', 'Set the base path and override config.base')
    .action(
      async (
        root,
        options?: {
          port?: number;
          host?: string;
          base?: string;
          config?: string;
        },
      ) => {
        setNodeEnv('development');
        const cwd = process.cwd();
        let devServer: Awaited<ReturnType<typeof dev>>;
        const startDevServer = async () => {
          const { port, host } = options || {};
          const { config, configFilePath } = await loadConfigFile(
            options?.config,
          );

          config.root = resolveDocRoot(cwd, root, config.root);

          if (options?.base) {
            config.base = options.base;
          }

          const docDirectory = config.root;

          devServer = await dev({
            appDirectory: cwd,
            docDirectory,
            config,
            configFilePath,
            extraBuilderConfig: { server: { port, host } },
            restart,
          });
        };

        const restart: RestartFn = async () => {
          try {
            await startDevServer();
            return true;
          } catch (error) {
            logger.error(error);
            return false;
          }
        };

        await startDevServer();

        const exitProcess = async () => {
          try {
            await devServer.close();
          } finally {
            process.exit(0);
          }
        };

        process.on('SIGINT', exitProcess);
        process.on('SIGTERM', exitProcess);
      },
    );

  cli
    .command('build [root]', 'Build the documentation site for production')
    .option('--base <base>', 'Set the base path and override config.base')
    .action(async (root, options) => {
      setNodeEnv('production');
      const cwd = process.cwd();
      const { config, configFilePath } = await loadConfigFile(options.config);

      config.root = resolveDocRoot(cwd, root, config.root);

      if (options.base) {
        config.base = options.base;
      }
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
    .command('preview [root]', 'Preview the production build locally')
    .alias('serve')
    .option('--port <port>', 'Set the port number for the server')
    .option('--host [host]', 'Set the host that the server listens to')
    .option('--base <base>', 'Set the base path and override config.base')
    .action(
      async (
        root,
        options?: {
          port?: number;
          host?: string;
          base?: string;
          config?: string;
        },
      ) => {
        setNodeEnv('production');
        const cwd = process.cwd();
        const { port, host } = options || {};
        const { config, configFilePath } = await loadConfigFile(
          options?.config,
        );

        config.root = resolveDocRoot(cwd, root, config.root);

        if (options?.base) {
          config.base = options.base;
        }

        await serve({
          config,
          host,
          port,
          configFilePath,
        });
      },
    );

  cli
    .command('eject [component]', 'Eject a theme component for customization')
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

  cli.parse(argv);
}
