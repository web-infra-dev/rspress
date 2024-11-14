import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ESLintTemplateName, create } from 'create-rstack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: add more templates
async function getTemplateName() {
  return 'basic';
}

function mapESLintTemplate(): ESLintTemplateName {
  return 'vanilla-ts' as ESLintTemplateName;
}

create({
  root: path.resolve(__dirname, '..'),
  name: 'rspress',
  templates: ['basic'],
  getTemplateName,
  mapESLintTemplate,
});
