import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const themeTemplateDir = path.join(__dirname, 'template-theme');

const generatedTemplates = [
  {
    from: 'template-basic',
    to: 'template-basic-theme',
  },
  {
    from: 'template-i18n',
    to: 'template-i18n-theme',
  },
];

for (const { from, to } of generatedTemplates) {
  const targetDir = path.join(packageRoot, to);

  rmSync(targetDir, { recursive: true, force: true });
  cpSync(path.join(packageRoot, from), targetDir, { recursive: true });
  cpSync(themeTemplateDir, targetDir, { recursive: true });
}
