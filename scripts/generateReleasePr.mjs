#!/usr/bin/env zx

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { $, chalk } from 'zx';

$.verbose = false;

async function getCurrentVersion() {
  const packageJsonPath = path.join(
    process.cwd(),
    'packages/core/package.json',
  );
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  return packageJson.version;
}

function parseVersion(version) {
  const match = version.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+)\.(\d+))?$/,
  );

  if (!match) {
    throw new Error(`Invalid current version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    preid: match[4],
    prereleaseVersion: match[5] === undefined ? undefined : Number(match[5]),
  };
}

function compareVersions(a, b) {
  const parsedA = parseVersion(a);
  const parsedB = parseVersion(b);

  for (const key of ['major', 'minor', 'patch']) {
    if (parsedA[key] !== parsedB[key]) {
      return parsedA[key] > parsedB[key] ? 1 : -1;
    }
  }

  return 0;
}

function isPrerelease(version) {
  return parseVersion(version).preid !== undefined;
}

function satisfiesCaretRange(version, rangeVersion) {
  const parsedVersion = parseVersion(version);
  const parsedRange = parseVersion(rangeVersion);

  if (compareVersions(version, rangeVersion) < 0) {
    return false;
  }

  if (parsedRange.major > 0) {
    return parsedVersion.major === parsedRange.major;
  }

  if (parsedRange.minor > 0) {
    return (
      parsedVersion.major === parsedRange.major &&
      parsedVersion.minor === parsedRange.minor
    );
  }

  return (
    parsedVersion.major === parsedRange.major &&
    parsedVersion.minor === parsedRange.minor &&
    parsedVersion.patch === parsedRange.patch
  );
}

async function getNextVersion(currentVersion, type) {
  const { major, minor, patch, preid, prereleaseVersion } =
    parseVersion(currentVersion);

  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    case 'alpha':
    case 'beta':
    case 'rc':
      if (preid === type && prereleaseVersion !== undefined) {
        return `${major}.${minor}.${patch}-${type}.${prereleaseVersion + 1}`;
      }
      return `${major}.${minor}.${patch + 1}-${type}.0`;
    default:
      throw new Error('Invalid version type');
  }
}

async function getPackageJsonPaths() {
  const packagesDir = path.join(process.cwd(), 'packages');
  const packageDirs = await fs.readdir(packagesDir, { withFileTypes: true });
  const packageJsonPaths = [];

  for (const dirent of packageDirs) {
    if (!dirent.isDirectory()) {
      continue;
    }

    const packageJsonPath = path.join(packagesDir, dirent.name, 'package.json');

    try {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8'),
      );

      if (!packageJson.private) {
        packageJsonPaths.push(packageJsonPath);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  return packageJsonPaths.sort();
}

async function updateInternalDependencyRanges(packageJsonPaths, nextVersion) {
  const packageNames = new Set();

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    packageNames.add(packageJson.name);
  }

  for (const packageJsonPath of packageJsonPaths) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    let changed = false;

    for (const field of [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ]) {
      const dependencies = packageJson[field];

      if (!dependencies) {
        continue;
      }

      for (const [name, specifier] of Object.entries(dependencies)) {
        if (!packageNames.has(name)) {
          continue;
        }

        const match = specifier.match(/^workspace:\^(.+)$/);

        if (
          match &&
          (isPrerelease(nextVersion) ||
            !satisfiesCaretRange(nextVersion, match[1]))
        ) {
          dependencies[name] = `workspace:^${nextVersion}`;
          changed = true;
        }
      }
    }

    if (changed) {
      await fs.writeFile(
        packageJsonPath,
        `${JSON.stringify(packageJson, null, 2)}\n`,
      );
    }
  }
}

async function main() {
  try {
    // 1. Read the current version
    const currentVersion = await getCurrentVersion();
    console.log(chalk.blue(`Current version: ${currentVersion}`));

    // 2. Determine bump type and next release version
    const options = {
      type: {
        type: 'string',
        short: 't',
        default: 'patch',
      },
    };
    const args = process.argv.slice(3);
    const { values } = parseArgs({ args, options });

    const bumpType = values.type;

    if (
      !['major', 'minor', 'patch', 'alpha', 'beta', 'rc'].includes(bumpType)
    ) {
      console.error(
        'Invalid bump type. Please select major, minor, patch, alpha, beta, or rc.',
      );
      process.exit(1);
    }

    console.log(chalk.blue(`Bump type: ${bumpType}`));

    const nextVersion = await getNextVersion(currentVersion, bumpType);
    console.log(chalk.blue(`Next version: ${nextVersion}`));

    // 3. Create and switch to new branch
    const branchName = `release_v${nextVersion}`;
    console.log(chalk.blue(`Creating branch: ${branchName}`));

    await $`git checkout -b ${branchName}`;

    // 4. Bump all public packages in the fixed release group
    const packageJsonPaths = await getPackageJsonPaths();
    await $`pnpm exec bumpp ${packageJsonPaths} --release ${nextVersion} --yes --no-commit --no-tag --no-push --ignore-scripts`;
    await updateInternalDependencyRanges(packageJsonPaths, nextVersion);

    // 5. Update lockfile
    await $`pnpm install --ignore-scripts`;

    // 6. Commit changes
    await $`git add .`;
    await $`git commit -m "Release v${nextVersion}"`;

    // 7. Push to remote repo
    await $`git push -u origin ${branchName}`;

    console.log(chalk.green(`Successfully created and pushed ${branchName}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

main();
