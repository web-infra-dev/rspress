#!/usr/bin/env node
import path from 'node:path';
import { cac } from 'cac';
import prompts from 'prompts';
import fs from 'fs-extra';
import {
  copyFolder,
  initSitePrompts,
  formatTargetDir,
  getPkgManager,
  renderFile,
  cancelPrompt,
} from './utils';
import type { CustomPromptObject } from './types';

const cli = cac('create-rspress').help();

cli.command('', 'Create a new rspress site').action(async () => {
  const siteOptions: CustomPromptObject[] = [
    {
      name: 'siteTitle',
      type: 'text',
      message: 'Site Title',
      initial: 'Rspress',
      value: '',
    },
    {
      name: 'siteDesc',
      type: 'text',
      message: 'Site Description',
      initial: 'Rspack-based Static Site Generator',
      value: '',
    },
  ];

  const defaultProjectName = 'rspress-site';
  let targetDir = defaultProjectName;
  const promptProjectDir = async () =>
    await prompts(
      [
        {
          type: 'text',
          name: 'projectDir',
          initial: defaultProjectName,
          message: 'Project folder',
          onState: state => {
            targetDir = formatTargetDir(state.value) || defaultProjectName;
          },
        },
      ],
      { onCancel: cancelPrompt },
    );

  await promptProjectDir();
  let root = path.resolve(process.cwd(), targetDir);
  while (fs.existsSync(root)) {
    console.log(
      `${targetDir} is not empty, please choose another project name`,
    );
    await promptProjectDir();
    root = path.resolve(process.cwd(), targetDir);
  }

  await initSitePrompts(siteOptions);

  await fs.mkdir(root, { recursive: true });
  const srcFolder = path.resolve(__dirname, '../template');
  await copyFolder(srcFolder, targetDir);

  const filesToInterpret = ['docs/index.md', 'rspress.config.ts'];
  const siteData = siteOptions.reduce((prev: Record<string, any>, cur) => {
    prev[cur.name as string] = cur.value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
    return prev;
  }, {});
  for (const file of filesToInterpret) {
    await renderFile(file, targetDir, targetDir, siteData);
  }

  const pkgManager = getPkgManager();
  console.log('\nDone. Now run:\n');
  console.log(`cd ${targetDir}\n`);
  console.log(`${pkgManager} install\n`);
  console.log(`${pkgManager} run dev\n`);
});

cli.parse();
