import { Tabs, Tab } from '../Tabs';
import { Pre } from '../../layout/DocLayout/docComponents/pre';
import { Code } from '../../layout/DocLayout/docComponents/code';
import { Npm } from './icons/Npm';
import { Yarn } from './icons/Yarn';
import { Pnpm } from './icons/Pnpm';
import './index.scss';

export interface PackageManagerTabProps {
  command:
    | string
    | {
        npm: string;
        yarn: string;
        pnpm: string;
      };
  additionalTabs?: {
    tool: string;
    icon?: React.ReactNode;
  }[];
}

function normalizeYarnCommand(command: string): string {
  if (!command.includes('install')) {
    return command;
  }
  // If command include `install` and package name, replace `install` with `add`
  const pureCommand = command
    .split(' ')
    .filter(item => !item.startsWith('-') && !item.startsWith('--'))
    .join(' ');
  if (pureCommand === 'yarn install') {
    return command;
  } else {
    return command.replace('install', 'add');
  }
}

export function PackageManagerTabs({
  command,
  additionalTabs = [],
}: PackageManagerTabProps) {
  let commandInfo: {
    npm: string;
    yarn: string;
    pnpm: string;
    [key: string]: string;
  };

  // Init Icons
  const packageMangerToIcon = {
    npm: <Npm />,
    yarn: <Yarn />,
    pnpm: <Pnpm />,
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
    };
    additionalTabs.forEach(tab => {
      commandInfo[tab.tool] = `${tab.tool} ${command}`;
    });
  } else {
    commandInfo = command;
  }

  // Normalize yarn command
  commandInfo.yarn = normalizeYarnCommand(commandInfo.yarn);

  return (
    <Tabs
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
          <span style={{ marginLeft: 6, marginBottom: 4 }}>{key}</span>
        </div>
      ))}
    >
      {Object.entries(commandInfo).map(([key, value]) => (
        <Tab key={key}>
          <Pre>
            <Code className="language-js">{value}</Code>
          </Pre>
        </Tab>
      ))}
    </Tabs>
  );
}

export { Tab } from '@theme';
