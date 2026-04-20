import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';

const loadConfigFile = rs.fn();
const build = rs.fn();
const dev = rs.fn();
const serve = rs.fn();
const watch = rs.fn();
const commandActions = new Map<string, (...args: unknown[]) => unknown>();
const parse = rs.fn();
const CLI_BASE_OPTION = '/bar/';

const cli = {
  version: () => cli,
  help: () => cli,
  option: () => cli,
  command: (name: string) => {
    const command = {
      alias: () => command,
      option: () => command,
      action: (handler: (...args: unknown[]) => unknown) => {
        commandActions.set(name, handler);
        return command;
      },
    };

    return command;
  },
  parse,
};

rs.mock('@rspress/shared/logger', () => ({
  logger: {
    greet: rs.fn(),
    info: rs.fn(),
    warn: rs.fn(),
    error: rs.fn(),
    success: rs.fn(),
  },
}));

rs.mock('cac', () => ({
  cac: rs.fn(() => cli),
}));

rs.mock('../../src/config/loadConfigFile', () => ({
  loadConfigFile,
  resolveDocRoot: (cwd: string, cliRoot?: string, configRoot?: string) => {
    if (cliRoot) {
      return path.join(cwd, cliRoot);
    }

    if (configRoot) {
      return path.isAbsolute(configRoot)
        ? configRoot
        : path.join(cwd, configRoot);
    }

    return path.join(cwd, 'docs');
  },
}));

rs.mock('../../src/node/index', () => ({
  build,
  dev,
  serve,
}));

rs.mock('chokidar', () => ({
  default: {
    watch,
  },
}));

const cwd = process.cwd();
const originalArgv = [...process.argv];
const originalCwd = process.cwd();
const originalNodeEnv = process.env.NODE_ENV;

const createConfig = () => ({
  root: path.join(cwd, 'docs'),
  base: '/from-config/',
});

const loadCli = async () => {
  await import('../../src/cli/index');
};

describe('cli --base option', () => {
  beforeEach(() => {
    rs.clearAllMocks();
    rs.resetModules();
    commandActions.clear();
    process.chdir(cwd);

    loadConfigFile.mockResolvedValue({
      config: createConfig(),
      configFilePath: path.join(cwd, 'rspress.config.ts'),
    });
    build.mockResolvedValue(undefined);
    dev.mockResolvedValue({
      close: rs.fn().mockResolvedValue(undefined),
    });
    serve.mockResolvedValue(undefined);
    watch.mockReturnValue({
      on: rs.fn(),
      close: rs.fn().mockResolvedValue(undefined),
    });
    rs.spyOn(process, 'on').mockReturnValue(process);
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env.NODE_ENV = originalNodeEnv;
    process.chdir(originalCwd);
    rs.restoreAllMocks();
  });

  it('should override config.base for build command', async () => {
    await loadCli();

    const action = commandActions.get('build [root]');
    await action?.(undefined, { base: CLI_BASE_OPTION });

    expect(loadConfigFile).toHaveBeenCalledWith(undefined);
    expect(build).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          base: CLI_BASE_OPTION,
        }),
      }),
    );
  });

  it('should override config.base for dev command', async () => {
    await loadCli();

    const action = commandActions.get('[root]');
    await action?.(undefined, { base: CLI_BASE_OPTION });

    expect(loadConfigFile).toHaveBeenCalledWith(undefined);
    expect(dev).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          base: CLI_BASE_OPTION,
        }),
      }),
    );
  });

  it('should override config.base for preview command', async () => {
    await loadCli();

    const action = commandActions.get('preview [root]');
    await action?.(undefined, { base: CLI_BASE_OPTION });

    expect(loadConfigFile).toHaveBeenCalledWith(undefined);
    expect(serve).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          base: CLI_BASE_OPTION,
        }),
      }),
    );
  });
});
