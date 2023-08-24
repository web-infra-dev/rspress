#!/usr/bin/env node
import path from 'path';
import { cac } from 'cac';
import prompts from 'prompts';
import fs from 'fs-extra';
import { copyFolder, formatTargetDir, getPkgManager } from './utils';

const cli = cac('create-rspress').help();

cli.command('', 'Create a new rspress site').action(async () => {
  const defaultProjectName = 'rspress-site';
  let targetDir = defaultProjectName;
  const promptProjectDir = async () =>
    await prompts([
      {
        type: 'text',
        name: 'projectDir',
        initial: defaultProjectName,
        message: 'Project folder',
        onState: state => {
          targetDir = formatTargetDir(state.value) || defaultProjectName;
        },
      },
    ]);

  await promptProjectDir();
  let root = path.resolve(process.cwd(), targetDir);
  while (fs.existsSync(root)) {
    console.log(
      `${targetDir} is not empty, please choose another project name`,
    );
    await promptProjectDir();
    root = path.resolve(process.cwd(), targetDir);
  }

  await fs.mkdir(root, { recursive: true });
  const srcFolder = path.resolve(__dirname, '../template');
  await copyFolder(srcFolder, targetDir);
  const pkgManager = getPkgManager();
  console.log('\nDone. Now run:\n');
  console.log(`cd ${targetDir}\n`);
  console.log(`${pkgManager} install\n`);
  console.log(`${pkgManager} run dev\n`);
});

cli.parse();
