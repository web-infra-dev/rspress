import fs from 'node:fs';
import path from 'node:path';
import { logger } from '@rspress/shared/logger';
import enhancedResolve from 'enhanced-resolve';
import { PACKAGE_ROOT } from '../constants';
import { pathExists, readJson } from './fs';

// TODO: replace enhanced-resolve with this.getResolver
const { CachedInputFileSystem, ResolverFactory } = enhancedResolve;

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

const DEFAULT_REACT_VERSION = 19;
export async function detectReactVersion(): Promise<number> {
  return (await detectPackageMajorVersion('react')) ?? DEFAULT_REACT_VERSION;
}

export async function resolveReactAlias(reactVersion: number, isSSR: boolean) {
  const basedir =
    reactVersion === DEFAULT_REACT_VERSION ? PACKAGE_ROOT : process.cwd();
  const libPaths = [
    'react',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-dom',
    'react-dom/server',
  ];
  if (reactVersion >= 18) {
    libPaths.push('react-dom/client');
  }
  const alias: Record<string, string> = {};
  const resolver = ResolverFactory.createResolver({
    fileSystem: new CachedInputFileSystem(
      fs as unknown as enhancedResolve.CachedInputFileSystem['fileSystem'],
      0,
    ),
    extensions: ['.js'],
    alias,
    conditionNames: isSSR ? ['...'] : ['browser', '...'],
  });
  await Promise.all(
    libPaths.map(async lib => {
      try {
        alias[lib] = await new Promise<string>((resolve, reject) => {
          resolver.resolve(
            { importer: basedir },
            basedir,
            lib,
            {},
            (err, filePath) => {
              if (err || !filePath) {
                return reject(err);
              }
              return resolve(filePath);
            },
          );
        });
      } catch (e) {
        logger.warn(`${lib} not found: \n`, e);
      }
    }),
  );
  return alias;
}
