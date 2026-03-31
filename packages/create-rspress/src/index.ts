import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Argv,
  checkCancel,
  create,
  type ESLintTemplateName,
  select,
} from 'create-rstack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templates = ['basic', 'custom-theme'] as const;

type TemplateName = (typeof templates)[number];

async function getTemplateName(argv: Argv): Promise<TemplateName> {
  if (argv.template) {
    if (templates.includes(argv.template as TemplateName)) {
      return argv.template as TemplateName;
    }

    throw new Error(
      `Invalid template "${argv.template}". Expected one of: ${templates.join(', ')}.`,
    );
  }

  return checkCancel(
    await select<TemplateName>({
      message: 'Would you like to customize the theme styles?',
      initialValue: 'custom-theme',
      options: [
        {
          value: 'custom-theme',
          label: 'Yes, set up a "theme" folder for customization',
          hint: 'Modify styles and components later.',
        },
        {
          value: 'basic',
          label: 'No, use the default theme',
        },
      ],
    }),
  );
}

function mapESLintTemplate(): ESLintTemplateName {
  return 'vanilla-ts' as ESLintTemplateName;
}

create({
  root: path.resolve(__dirname, '..'),
  name: 'rspress',
  skipFiles: ['template-placeholder'],
  templates: [...templates],
  getTemplateName,
  mapESLintTemplate,
});
