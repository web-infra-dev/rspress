import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRsbuild } from '@rsbuild/core';
import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { HeadlessStylePlugin } from './headlessStylePlugin';

describe('HeadlessStylePlugin', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'rspress-headless-plugin-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('replaces built-in theme styles and strips component/layout CSS while preserving user CSS', async () => {
    const themeDir = path.join(tempDir, 'theme');
    const userDir = path.join(tempDir, 'user');
    const outDir = path.join(tempDir, 'dist');
    const emptyCssPath = path.join(tempDir, 'empty.css');

    await Promise.all([
      mkdir(path.join(themeDir, 'styles'), { recursive: true }),
      mkdir(path.join(themeDir, 'components/Button'), { recursive: true }),
      mkdir(path.join(themeDir, 'layout/DocLayout'), { recursive: true }),
      mkdir(userDir, { recursive: true }),
    ]);

    await Promise.all([
      writeFile(emptyCssPath, '/* empty */\n'),
      writeFile(
        path.join(themeDir, 'styles/index.js'),
        "import './default.css';\n",
      ),
      writeFile(
        path.join(themeDir, 'styles/default.css'),
        '.default-skin { color: red; }\n',
      ),
      writeFile(
        path.join(themeDir, 'styles/headless.js'),
        "import './headless.css';\n",
      ),
      writeFile(
        path.join(themeDir, 'styles/headless.css'),
        '@layer rp-headless { .headless-skeleton { display: flex; } }\n',
      ),
      writeFile(
        path.join(themeDir, 'components/Button/index.js'),
        "import './index.css';\nexport const Button = 'btn';\n",
      ),
      writeFile(
        path.join(themeDir, 'components/Button/index.css'),
        '.rp-button-skin { border-radius: 999px; }\n',
      ),
      writeFile(
        path.join(themeDir, 'layout/DocLayout/index.js'),
        "import './index.css';\nexport const DocLayout = 'layout';\n",
      ),
      writeFile(
        path.join(themeDir, 'layout/DocLayout/index.css'),
        '.rp-doc-layout-skin { box-shadow: 0 0 10px black; }\n',
      ),
      writeFile(
        path.join(userDir, 'custom.css'),
        '.user-custom { color: rgb(12, 34, 56); }\n',
      ),
      writeFile(
        path.join(userDir, 'entry.js'),
        [
          `import ${JSON.stringify(path.join(themeDir, 'styles/index.js'))};`,
          `import { Button } from ${JSON.stringify(path.join(themeDir, 'components/Button/index.js'))};`,
          `import { DocLayout } from ${JSON.stringify(path.join(themeDir, 'layout/DocLayout/index.js'))};`,
          "import './custom.css';",
          'console.log(Button, DocLayout);',
        ].join('\n'),
      ),
    ]);

    const rsbuild = await createRsbuild({
      cwd: tempDir,
      config: {
        source: {
          entry: {
            index: path.join(userDir, 'entry.js'),
          },
        },
        output: {
          distPath: { root: outDir },
          minify: false,
        },
        performance: {
          printFileSize: false,
        },
        tools: {
          rspack: {
            plugins: [new HeadlessStylePlugin(themeDir, emptyCssPath)],
          },
        },
      },
    });

    await rsbuild.build();

    const cssDir = path.join(outDir, 'static/css');
    const cssFiles = (await readdir(cssDir)).filter(f => f.endsWith('.css'));
    const cssContent = (
      await Promise.all(
        cssFiles.map(file => readFile(path.join(cssDir, file), 'utf8')),
      )
    ).join('\n');

    expect(cssContent).toContain('.headless-skeleton');
    expect(cssContent).toContain('.user-custom');
    expect(cssContent).not.toContain('.default-skin');
    expect(cssContent).not.toContain('.rp-button-skin');
    expect(cssContent).not.toContain('.rp-doc-layout-skin');
  });
});
