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
const BASIC_TEMPLATE = 'basic';
const CUSTOM_THEME_TEMPLATE = 'basic-custom-theme';

async function getTemplateName(argv: Argv) {
  if (argv.template) {
    return argv.template;
  }

  return checkCancel(
    await select({
      message: '是否使用自定义主题？',
      options: [
        {
          value: CUSTOM_THEME_TEMPLATE,
          label: '是',
        },
        {
          value: BASIC_TEMPLATE,
          label: '否',
        },
      ],
      initialValue: BASIC_TEMPLATE,
    }),
  );
}

function mapESLintTemplate(): ESLintTemplateName {
  return 'vanilla-ts' as ESLintTemplateName;
}

create({
  root: path.resolve(__dirname, '..'),
  name: 'rspress',
  templates: [BASIC_TEMPLATE, CUSTOM_THEME_TEMPLATE],
  getTemplateName,
  mapESLintTemplate,
});
