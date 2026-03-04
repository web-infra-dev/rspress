import path from 'node:path';
import { rspack } from '@rsbuild/core';
import { logger } from '@rspress/shared/logger';
import picocolors from 'picocolors';
import { PACKAGE_ROOT } from '../constants';
import { hintReactVersion } from '../logger/hint';
import { pathExists, readJson } from './fs';

const Resolver = rspack.experiments.resolver.ResolverFactory;

async function detectPackageMajorVersion(
  name: string,
): Promise<number | undefined> {
  const cwd = process.cwd();
  const pkgPath = path.join(cwd, 'node_modules', name);
  if (await pathExists(pkgPath)) {
    const pkgJson = await readJson<{ version?: string }>(
      path.join(pkgPath, 'package.json'),
    );
    const version = Number(pkgJson.version?.split('.')[0]);
    return version;
  }

  return undefined;
}

export async function resolveReactRouterDomAlias(): Promise<
  Record<string, string>
> {
  const hasInstalled = await detectPackageMajorVersion('react-router-dom');
  const basedir = hasInstalled ? process.cwd() : PACKAGE_ROOT;

  const alias: Record<string, string> = {};
  const resolver = new Resolver({
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.js'],
    alias,
  });

  try {
    const resolved = await resolver.async(
      basedir,
      'react-router-dom/package.json',
    );
    if (resolved.error) {
      throw Error(resolved.error);
    }

    if (!resolved.path) {
      throw Error(`'react-router-dom' resolved to empty path`);
    }
    return {
      'react-router-dom': path.dirname(resolved.path),
    };
  } catch (e) {
    logger.warn('react-router-dom not found: \n', e);
  }
  return {};
}

export async function resolveReactAlias(isSSR: boolean) {
  const hasInstalled = await detectPackageMajorVersion('react');
  const basedir = hasInstalled ? process.cwd() : PACKAGE_ROOT;

  const libPaths = [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react/package.json',
    'react-dom',
    'react-dom/client',
    'react-dom/server',
    'react-dom/package.json',
  ];

  const alias: Record<string, string> = {};
  const resolver = new Resolver({
    extensions: ['.js'],
    alias,
    conditionNames: isSSR ? ['...'] : ['browser', '...'],
  });

  await Promise.all(
    libPaths.map(async lib => {
      try {
        const resolved = await resolver.async(basedir, lib);

        if (resolved.error || !resolved.path) {
          throw Error(resolved.error);
        }

        alias[lib] = resolved.path;
      } catch (e) {
        if (e instanceof Error) {
          logger.warn(
            `${lib} not found: \n    ${picocolors.gray(e.toString())}`,
          );
          hintReactVersion();
        }
      }
    }),
  );
  return alias;
}

export async function resolveReactRenderToMarkdownAlias(): Promise<
  Record<string, string>
> {
  const hasInstalled = await detectPackageMajorVersion(
    'react-render-to-markdown',
  );

  if (!hasInstalled) {
    // No alias needed — rspack will resolve from @rspress/core's dependencies
    const reactMajorVersion = await detectPackageMajorVersion('react');
    if (reactMajorVersion && reactMajorVersion < 19) {
      logger.warn(
        `You are using React ${reactMajorVersion} with \`llms: true\`. Please install \`react-render-to-markdown\` to ensure compatibility.\n\n` +
          `Add the following to your ${picocolors.greenBright('package.json')}:\n\n` +
          picocolors.greenBright(
            `  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "react-render-to-markdown": "^18.3.1"\n  }\n`,
          ),
      );
    }
    return {};
  }

  // User has installed react-render-to-markdown in their project,
  // use user's version (e.g., react-render-to-markdown@18 for React 18 compatibility)
  const alias: Record<string, string> = {};
  const resolver = new Resolver({
    extensions: ['.js'],
    alias,
    conditionNames: ['import', 'require', 'node', 'default'],
  });

  try {
    const resolved = await resolver.async(
      process.cwd(),
      'react-render-to-markdown',
    );
    if (resolved.error) {
      throw Error(resolved.error);
    }

    if (!resolved.path) {
      throw Error(`'react-render-to-markdown' resolved to empty path`);
    }
    return {
      'react-render-to-markdown': resolved.path,
    };
  } catch (e) {
    logger.warn('react-render-to-markdown not found: \n', e);
  }
  return {};
}
