import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { pathExists } from '@rspress/shared/fs-extra';
import { logger } from '@rspress/shared/logger';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

const lockfileMap: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
};

async function getPackageManager(rootPath: string) {
  let packageManager: PackageManager = 'npm';
  for (const file of Object.keys(lockfileMap)) {
    if (await pathExists(path.join(rootPath, file))) {
      packageManager = lockfileMap[file];
      break;
    }
  }
  return packageManager;
}

async function getRspressDependencies(rootPath: string) {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(rootPath, 'package.json'), {
      encoding: 'utf-8',
    }),
  );
  const dependencies = packageJson?.dependencies
    ? Object.keys(packageJson.dependencies)
    : [];
  const devDependencies = packageJson?.devDependencies
    ? Object.keys(packageJson.devDependencies)
    : [];
  return dependencies
    .concat(devDependencies)
    .filter(item => item.startsWith('@rspress') || item.startsWith('rspress'));
}

export default async function update() {
  const cwd = process.cwd();
  const packageManager = await getPackageManager(cwd);
  const rspressDependencies = await getRspressDependencies(cwd);

  logger.greet(
    `Using ${packageManager} to update ${rspressDependencies.join(' ')}`,
  );
  if (packageManager === 'npm' || packageManager === 'bun') {
    const dependencies = rspressDependencies.map(item => `${item}@latest`);
    spawn(packageManager, ['install', '--save', ...dependencies], {
      stdio: 'inherit',
    });
  } else {
    const subCommand = packageManager === 'yarn' ? 'upgrade' : 'update';
    spawn(packageManager, [subCommand, '--latest', ...rspressDependencies], {
      stdio: 'inherit',
    });
  }
}
