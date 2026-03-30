import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkCancel,
  collectAgentsFiles,
  copyFolder,
  mergeAgentsFiles,
  multiselect,
  select,
  text,
} from 'create-rstack';

type Argv = {
  help?: boolean;
  dir?: string;
  override?: boolean;
  packageName?: string;
  template?: string;
  tools?: string | string[];
};

type BuiltinTool = 'biome' | 'eslint' | 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CREATE_RSTACK_ROOT = path.resolve(ROOT, 'node_modules/create-rstack');
const BASIC_TEMPLATE = 'basic';
const CUSTOM_THEME_TEMPLATE_ALIAS = 'basic-custom-theme';
const CUSTOM_THEME_TOOL = 'custom-theme';
const BUILTIN_TOOLS: BuiltinTool[] = ['biome', 'eslint', 'prettier'];

function parseArgv(processArgv: string[]): Argv {
  const argv: Argv & { positional: string[] } = { positional: [] };

  for (let i = 2; i < processArgv.length; i++) {
    const arg = processArgv[i];

    if (arg === '-h' || arg === '--help') {
      argv.help = true;
      continue;
    }

    if (arg === '--override') {
      argv.override = true;
      continue;
    }

    if (arg === '-d' || arg === '--dir') {
      argv.dir = processArgv[++i];
      continue;
    }

    if (arg.startsWith('--dir=')) {
      argv.dir = arg.slice('--dir='.length);
      continue;
    }

    if (arg === '-t' || arg === '--template') {
      argv.template = processArgv[++i];
      continue;
    }

    if (arg.startsWith('--template=')) {
      argv.template = arg.slice('--template='.length);
      continue;
    }

    if (arg === '--tools') {
      argv.tools = processArgv[++i];
      continue;
    }

    if (arg.startsWith('--tools=')) {
      argv.tools = arg.slice('--tools='.length);
      continue;
    }

    if (arg === '--packageName' || arg === '--package-name') {
      argv.packageName = processArgv[++i];
      continue;
    }

    if (arg.startsWith('--packageName=') || arg.startsWith('--package-name=')) {
      argv.packageName = arg.slice(arg.indexOf('=') + 1);
      continue;
    }

    if (!arg.startsWith('-')) {
      argv.positional.push(arg);
    }
  }

  if (!argv.dir && argv.positional[0]) {
    argv.dir = argv.positional[0];
  }

  return argv;
}

function parseToolsOption(tools: Argv['tools']): string[] | null {
  if (tools === undefined) {
    return null;
  }

  const toolsArr = Array.isArray(tools) ? tools : [tools];
  return toolsArr
    .flatMap(tool => tool.split(','))
    .map(tool => tool.trim())
    .filter(Boolean);
}

function isBuiltinTool(tool: string): tool is BuiltinTool {
  return BUILTIN_TOOLS.includes(tool as BuiltinTool);
}

function readPackageJson(filePath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(filePath, 'package.json'), 'utf-8'),
  );
}

function getPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (!userAgent) {
    return 'npm';
  }

  const [pkgSpec] = userAgent.split(' ');
  const [name] = pkgSpec.split('/');
  return name || 'npm';
}

function formatProjectName(input: string) {
  const targetDir = input.trim().replace(/\/+$/g, '');
  return {
    packageName: targetDir.startsWith('@')
      ? targetDir
      : path.basename(targetDir),
    targetDir,
  };
}

function isEmptyDir(targetDir: string) {
  const files = fs.readdirSync(targetDir);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

function replacePlaceholder(
  content: string,
  templateParameters: Record<string, string>,
) {
  let result = content;

  for (const key of Object.keys(templateParameters)) {
    result = result.replace(
      new RegExp(`\\{\\{ ${key} \\}\\}`, 'g'),
      templateParameters[key],
    );
  }

  return result;
}

function writeAgentsFile(
  agentsMdSearchDirs: string[],
  distFolder: string,
  templateParameters: Record<string, string>,
) {
  const agentsFiles = collectAgentsFiles(agentsMdSearchDirs);

  if (agentsFiles.length === 0) {
    return;
  }

  const mergedAgents = mergeAgentsFiles(agentsFiles);
  const agentsPath = path.join(distFolder, 'AGENTS.md');
  fs.writeFileSync(
    agentsPath,
    `${replacePlaceholder(mergedAgents, templateParameters)}\n`,
  );
}

function logHelpMessage() {
  console.log(`
Usage: create-rspress [dir] [options]

Options:
  -h, --help                 display help for command
  -d, --dir <dir>            create project in specified directory
  -t, --template <tpl>       specify the template to use
  --tools <tool>             add additional tools, comma separated
  --override                 override files in target directory
  --packageName <name>       specify the package name

Available templates:
  ${BASIC_TEMPLATE}

Optional tools:
  ${CUSTOM_THEME_TOOL}, ${BUILTIN_TOOLS.join(', ')}
`);
}

async function promptProjectName() {
  return checkCancel(
    await text({
      message: 'Project name or path',
      placeholder: 'rspress-project',
      defaultValue: 'rspress-project',
      validate(value) {
        if (value?.length === 0) {
          return 'Project name is required';
        }
      },
    }),
  );
}

async function promptOverride(targetDir: string) {
  const option = checkCancel(
    await select({
      message: `"${targetDir}" is not empty, please choose:`,
      options: [
        {
          value: 'yes',
          label: 'Continue and override files',
        },
        {
          value: 'no',
          label: 'Cancel operation',
        },
      ],
    }),
  );

  if (option === 'no') {
    process.exit(0);
  }
}

async function promptCustomTheme() {
  return checkCancel(
    await select({
      message: 'Would you like to customize the theme styles?',
      options: [
        {
          value: true,
          label: 'Yes, set up a custom theme',
          hint: 'Use Rspress custom theme support so you can modify styles and components later.',
        },
        {
          value: false,
          label: 'No, use the default theme',
        },
      ],
      initialValue: false,
    }),
  );
}

async function promptBuiltinTools() {
  return checkCancel(
    await multiselect<BuiltinTool>({
      message:
        'Select additional tools (Use <space> to select, <enter> to continue)',
      options: [
        {
          value: 'biome',
          label: 'Biome - linting & formatting',
        },
        {
          value: 'eslint',
          label: 'ESLint - linting',
        },
        {
          value: 'prettier',
          label: 'Prettier - formatting',
        },
      ],
      required: false,
    }),
  );
}

function applyBuiltinTool(
  tool: BuiltinTool,
  distFolder: string,
  version: string,
  templateParameters: Record<string, string>,
  agentsMdSearchDirs: string[],
) {
  const toolFolder = path.join(CREATE_RSTACK_ROOT, `template-${tool}`);

  if (tool === 'eslint') {
    const eslintFolder = path.join(toolFolder, 'vanilla-ts');
    copyFolder({
      from: eslintFolder,
      to: distFolder,
      version,
      templateParameters,
      isMergePackageJson: true,
    });
    agentsMdSearchDirs.push(toolFolder, eslintFolder);
    return;
  }

  copyFolder({
    from: toolFolder,
    to: distFolder,
    version,
    templateParameters,
    isMergePackageJson: true,
  });

  agentsMdSearchDirs.push(toolFolder);

  if (tool === 'biome') {
    fs.renameSync(
      path.join(distFolder, 'biome.json.template'),
      path.join(distFolder, 'biome.json'),
    );
  }
}

async function main() {
  console.log('\n◆  Create Rspress Project');

  const argv = parseArgv(process.argv);

  if (argv.help) {
    logHelpMessage();
    return;
  }

  const hadDirArg = argv.dir !== undefined;
  const hadTemplateArg = argv.template !== undefined;
  const parsedTools = parseToolsOption(argv.tools);
  const version = readPackageJson(ROOT).version as string;
  const packageManager = getPackageManager();
  const templateParameters = { packageManager };
  const projectName = argv.dir ?? (await promptProjectName());
  const formatted = formatProjectName(projectName);
  const distFolder = path.isAbsolute(formatted.targetDir)
    ? formatted.targetDir
    : path.join(process.cwd(), formatted.targetDir);
  const packageName = argv.packageName || formatted.packageName;

  if (!argv.override && fs.existsSync(distFolder) && !isEmptyDir(distFolder)) {
    await promptOverride(formatted.targetDir);
  }

  const templateName =
    argv.template === CUSTOM_THEME_TEMPLATE_ALIAS
      ? BASIC_TEMPLATE
      : argv.template || BASIC_TEMPLATE;

  if (templateName !== BASIC_TEMPLATE) {
    throw new Error(`Invalid input: template "${templateName}" not found.`);
  }

  const useCustomTheme =
    argv.template === CUSTOM_THEME_TEMPLATE_ALIAS ||
    parsedTools?.includes(CUSTOM_THEME_TOOL) ||
    (parsedTools === null && process.stdout.isTTY
      ? await promptCustomTheme()
      : false);

  const builtinTools =
    parsedTools !== null
      ? parsedTools.filter(isBuiltinTool)
      : hadDirArg && hadTemplateArg
        ? []
        : process.stdout.isTTY
          ? await promptBuiltinTools()
          : [];

  const commonFolder = path.join(ROOT, 'template-common');
  const srcFolder = path.join(ROOT, `template-${templateName}`);
  const customThemeFolder = path.join(ROOT, 'template-custom-theme');
  const agentsMdSearchDirs = [commonFolder, srcFolder];

  copyFolder({
    from: commonFolder,
    to: distFolder,
    version,
    templateParameters,
  });

  copyFolder({
    from: srcFolder,
    to: distFolder,
    version,
    packageName,
    templateParameters,
  });

  if (useCustomTheme) {
    copyFolder({
      from: customThemeFolder,
      to: distFolder,
      version,
      templateParameters,
    });
    agentsMdSearchDirs.push(customThemeFolder);
  }

  for (const tool of builtinTools) {
    applyBuiltinTool(
      tool,
      distFolder,
      version,
      templateParameters,
      agentsMdSearchDirs,
    );
  }

  writeAgentsFile(agentsMdSearchDirs, distFolder, templateParameters);

  console.log(`
◇  Next steps

1. cd ${formatted.targetDir}
2. git init (optional)
3. ${packageManager} install
4. ${packageManager} run dev
`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
