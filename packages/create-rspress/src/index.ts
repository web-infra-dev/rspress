import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Argv,
  checkCancel,
  create,
  type ESLintTemplateName,
  type RslintTemplateName,
  select,
} from 'create-rstack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templates = ['basic', 'basic-theme', 'i18n', 'i18n-theme'] as const;

type TemplateName = (typeof templates)[number];
type I18nChoice = 'basic' | 'i18n';
type ThemeChoice = 'with-theme' | 'default-theme';

function isTemplateName(templateName: string): templateName is TemplateName {
  return templates.includes(templateName as TemplateName);
}

async function getTemplateName(argv: Argv): Promise<TemplateName> {
  if (argv.template) {
    if (isTemplateName(argv.template)) {
      return argv.template;
    }

    throw new Error(
      `Invalid template "${argv.template}". Expected one of: ${templates.join(', ')}.`,
    );
  }

  const i18nChoice = checkCancel<I18nChoice>(
    await select<I18nChoice>({
      message: 'Would you like to set up i18n?',
      initialValue: 'basic',
      options: [
        {
          value: 'basic',
          label: 'No, use a single language site',
          hint: 'Create regular docs.',
        },
        {
          value: 'i18n',
          label: 'Yes, set up i18n docs',
          hint: 'Create docs/en and docs/zh.',
        },
      ],
    }),
  );

  const themeChoice = checkCancel<ThemeChoice>(
    await select<ThemeChoice>({
      message: 'Would you like to create a theme folder for customization?',
      initialValue: 'with-theme',
      options: [
        {
          value: 'with-theme',
          label: 'Yes, set up a theme folder',
          hint: 'Modify styles and components later.',
        },
        {
          value: 'default-theme',
          label: 'No, use the default theme',
        },
      ],
    }),
  );

  return themeChoice === 'with-theme' ? `${i18nChoice}-theme` : i18nChoice;
}

function mapESLintTemplate(): ESLintTemplateName {
  return 'react-ts' as ESLintTemplateName;
}

function mapRslintTemplate(): RslintTemplateName {
  return 'react-ts' as RslintTemplateName;
}

create({
  root: path.resolve(__dirname, '..'),
  name: 'rspress',
  templates: [...templates],
  getTemplateName,
  mapESLintTemplate,
  mapRslintTemplate,
  extraSkills: [
    {
      value: 'rspress-best-practices',
      label: 'Rspress best practices',
      source: 'rstackjs/agent-skills',
    },
    {
      value: 'rspress-custom-theme',
      label: 'Rspress custom theme',
      source: 'rstackjs/agent-skills',
      when: ({ templateName }) => templateName.endsWith('-theme'),
    },
    {
      value: 'rspress-description-generator',
      label: 'Rspress description generator',
      source: 'rstackjs/agent-skills',
    },
  ],
});
