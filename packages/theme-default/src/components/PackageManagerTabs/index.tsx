import { Tabs, Tab } from '@theme';
import { Pre } from '../../layout/DocLayout/docComponents/pre';
import { Code } from '../../layout/DocLayout/docComponents/code';
import { Npm } from './icons/Npm';
import { Yarn } from './icons/Yarn';
import { Pnpm } from './icons/Pnpm';
import { Bun } from './icons/Bun';
import './index.scss';

export interface PackageManagerTabProps {
  command:
    | string
    | {
        npm?: string;
        yarn?: string;
        pnpm?: string;
        bun?: string;
      };
  additionalTabs?: {
    tool: string;
    icon?: React.ReactNode;
  }[];
}

function normalizeCommand(command: string): string {
  // If command is yarn create foo@latest, remove `@latest`
  if (command.startsWith('yarn create')) {
    return command.replace(/(yarn create [^\s]+)@latest/, '$1');
  }

  if (!command?.includes('install')) {
    return command;
  }

  // If command include `install` and package name, replace `install` with `add`
  const pureCommand = command
    .split(' ')
    .filter(item => !item.startsWith('-') && !item.startsWith('--'))
    .join(' ');
  if (pureCommand === 'yarn install' || pureCommand === 'bun install') {
    return command;
  }

  return command.replace('install', 'add');
}

export function PackageManagerTabs({
  command,
  additionalTabs = [],
}: PackageManagerTabProps) {
  let commandInfo: {
    npm?: string;
    yarn?: string;
    pnpm?: string;
    bun?: string;
    [key: string]: string;
  };

  // Init Icons
  const packageMangerToIcon = {
    npm: <Npm />,
    yarn: <Yarn />,
    pnpm: <Pnpm />,
    bun: <Bun />,
  };
  additionalTabs.forEach(tab => {
    packageMangerToIcon[tab.tool] = tab.icon;
  });

  // Init Command
  if (typeof command === 'string') {
    commandInfo = {
      npm: `npm ${command}`,
      yarn: `yarn ${command}`,
      pnpm: `pnpm ${command}`,
      bun: `bun ${command}`,
    };
    additionalTabs.forEach(tab => {
      commandInfo[tab.tool] = `${tab.tool} ${command}`;
    });
  } else {
    commandInfo = command;
  }

  // Normalize yarn/bun command
  commandInfo.yarn && (commandInfo.yarn = normalizeCommand(commandInfo.yarn));
  commandInfo.bun && (commandInfo.bun = normalizeCommand(commandInfo.bun));

  return (
    <Tabs
      groupId="package.manager"
      values={Object.entries(commandInfo).map(([key]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 15,
          }}
        >
          {packageMangerToIcon[key]}
          <span style={{ marginLeft: 6, marginBottom: 2 }}>{key}</span>
        </div>
      ))}
    >
      {Object.entries(commandInfo).map(([key, value]) => (
        <Tab key={key}>
          <Pre>
            {/* For this case, we can specify to highlight the code in runtime instead of compile time */}
            <Code className="language-js" codeHighlighter="prism">
              {value}
            </Code>
          </Pre>
        </Tab>
      ))}
    </Tabs>
  );
}

export { Tab } from '@theme';
