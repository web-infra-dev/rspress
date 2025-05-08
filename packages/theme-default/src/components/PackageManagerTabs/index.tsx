import { Tab, Tabs } from '@theme';
import { Pre } from '../../layout/DocLayout/docComponents/pre';
import { Bun } from './icons/Bun';
import { Npm } from './icons/Npm';
import { Pnpm } from './icons/Pnpm';
import { Yarn } from './icons/Yarn';
import './index.scss';
import type { ReactNode } from 'react';

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
    icon?: ReactNode;
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
  let commandInfo: Record<string, string>;
  // Init Icons
  const packageMangerToIcon: Record<string, ReactNode> = {
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
            {/* For this case, we has no highlight */}
            <code className="language-bash" style={{ whiteSpace: 'pre' }}>
              <span style={{ display: 'block', padding: '0px 1.25rem' }}>
                <span>{value}</span>
              </span>
            </code>
          </Pre>
        </Tab>
      ))}
    </Tabs>
  );
}

export { Tab } from '@theme';
