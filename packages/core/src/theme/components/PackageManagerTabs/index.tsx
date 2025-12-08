import { getCustomMDXComponent, Tab, Tabs } from '@theme';
import { type ReactNode, useMemo } from 'react';
import { Bun } from './icons/Bun';
import { Deno } from './icons/Deno';
import { Npm } from './icons/Npm';
import { Pnpm } from './icons/Pnpm';
import { Yarn } from './icons/Yarn';

export type PackageManagerTabProps = (
  | {
      command: string;
      /**
       * If true, uses local package execution (npx, yarn, pnpm, bun, deno run).
       * For locally installed packages in node_modules.
       */
      exec?: boolean;
      /**
       * If true, uses remote package execution (npx, yarn dlx, pnpm dlx, bunx, deno run).
       * For executing packages directly from registry without installing locally.
       * Takes precedence over exec prop.
       */
      dlx?: boolean;
    }
  | {
      command: {
        npm?: string;
        yarn?: string;
        pnpm?: string;
        bun?: string;
        deno?: string;
      };
      exec?: never;
      dlx?: never;
    }
) & {
  additionalTabs?: {
    tool: string;
    icon?: ReactNode;
  }[];
};

// Unified Deno transformation: for deno commands (run / add / install / init) we
// prefix positional package args with `npm:` unless the command already
// contains `--npm` or `--jsr` (in which case explicit npm behavior is desired).
const transformDenoPositional = (cmd: string) => {
  const parts = cmd.split(' ');
  const transformed = parts.map((tok, idx) => {
    // only transform positional args (after "deno" and the subcommand)
    if (
      idx >= 2 &&
      !tok.startsWith('-') &&
      !tok.includes(':') &&
      !/^https?:/.test(tok)
    ) {
      return `npm:${tok}`;
    }
    return tok;
  });
  return transformed.join(' ');
};

function normalizeCommand(command: string): string {
  // If command is `yarn create foo@latest`, remove `@latest`
  if (command.startsWith('yarn create')) {
    return command.replace(/(yarn create [^\s]+)@latest/, '$1');
  }

  if (command.startsWith('deno ')) {
    // convert `deno create X` -> `deno init --npm X`
    const transformedCmd = command.replace(
      /deno create\s+([^\s]+)/,
      'deno init --npm $1',
    );

    if (!transformedCmd.includes('install')) {
      // If the command explicitly requests --npm or --jsr, don't add npm: prefixes.
      if (
        transformedCmd.includes('--npm') ||
        transformedCmd.includes('--jsr')
      ) {
        return transformedCmd;
      }

      return transformDenoPositional(transformedCmd);
    }
  }

  if (!command?.includes('install')) {
    return command;
  }

  // If command include `install` and package name, replace `install` with `add`
  const pureCommand = command
    .split(' ')
    .filter(item => !item.startsWith('-') && !item.startsWith('--'))
    .join(' ');
  if (
    pureCommand === 'yarn install' ||
    pureCommand === 'pnpm install' ||
    pureCommand === 'bun install' ||
    pureCommand === 'deno install'
  ) {
    return command;
  }

  const replaced = command.replace(/\binstall\b/, 'add');

  // For deno after install->add replacement, apply the same unified deno logic
  if (replaced.startsWith('deno ')) {
    if (replaced.includes('--npm') || replaced.includes('--jsr')) {
      return replaced;
    }
    return transformDenoPositional(replaced);
  }

  return replaced;
}

/**
 * 'npm install foo@latest' -> ['npm', ' install foo@latest']
 */
function splitTo2Parts(command: string): [string, string] {
  const parts = command.split(' ');
  const firstPart = parts[0];
  const secondPart = command.slice(firstPart.length);
  return [firstPart, secondPart];
}

export function PackageManagerTabs({
  command,
  exec,
  dlx,
  additionalTabs = [],
}: PackageManagerTabProps) {
  let commandInfo: Record<string, string>;
  // Init Icons
  const packageMangerToIcon: Record<string, ReactNode> = {
    npm: <Npm />,
    yarn: <Yarn />,
    pnpm: <Pnpm />,
    bun: <Bun />,
    deno: <Deno />,
  };
  additionalTabs.forEach(tab => {
    packageMangerToIcon[tab.tool] = tab.icon;
  });

  const Pre = useMemo(() => {
    return getCustomMDXComponent().pre;
  }, [getCustomMDXComponent]);

  // Init Command
  if (typeof command === 'string') {
    const getPrefix = (packageManager: string) => {
      if (dlx) {
        // Remote package execution - fetch and run from registry
        switch (packageManager) {
          case 'npm':
            return 'npx';
          case 'yarn':
            return 'yarn dlx';
          case 'pnpm':
            return 'pnpm dlx';
          case 'bun':
            return 'bunx';
          case 'deno':
            return 'deno run';
          default:
            return packageManager;
        }
      } else if (exec) {
        // Local package execution - run from node_modules
        switch (packageManager) {
          case 'npm':
            return 'npx'; // npx works for both local and remote
          case 'yarn':
            return 'yarn';
          case 'pnpm':
            return 'pnpm';
          case 'bun':
            return 'bun';
          case 'deno':
            return 'deno run';
          default:
            return packageManager;
        }
      } else {
        // Default behavior - package management (install, etc)
        return packageManager;
      }
    };

    commandInfo = {
      npm: `${getPrefix('npm')} ${command}`,
      yarn: `${getPrefix('yarn')} ${command}`,
      pnpm: `${getPrefix('pnpm')} ${command}`,
      bun: `${getPrefix('bun')} ${command}`,
      deno: `${getPrefix('deno')} ${command}`,
    };
    additionalTabs.forEach(tab => {
      commandInfo[tab.tool] = `${tab.tool} ${command}`;
    });
    // Normalize yarn/pnpm/bun/deno command
    commandInfo.yarn = normalizeCommand(commandInfo.yarn);
    commandInfo.pnpm = normalizeCommand(commandInfo.pnpm);
    commandInfo.bun = normalizeCommand(commandInfo.bun);
    commandInfo.deno = normalizeCommand(commandInfo.deno);
  } else {
    // When using { "yarn": "", "pnpm": "", "bun": "", "deno": "" } as command we don't normalize anything
    commandInfo = command;
  }

  if (process.env.__SSR_MD__) {
    return Object.values(commandInfo).reduce((previous, current) => {
      const [packageManager, command] = splitTo2Parts(current);
      return (
        previous +
        `\n\`\`\`sh [${packageManager}]\n` +
        `${packageManager}${command}\n` +
        `\`\`\`\n`
      );
    }, '');
  }

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
      {Object.entries(commandInfo).map(([key, value]) => {
        const [packageManager, command] = splitTo2Parts(value);

        return (
          <Tab key={key}>
            <Pre
              lang="bash"
              className="shiki css-variables"
              style={{
                backgroundColor: 'var(--shiki-background)',
                color: 'var(--shiki-foreground)',
              }}
            >
              {/* For this case, we highlight the command manually */}
              <code style={{ whiteSpace: 'pre' }}>
                <span className="line">
                  <span style={{ color: 'var(--shiki-token-function)' }}>
                    {packageManager}
                  </span>
                  <span style={{ color: 'var(--shiki-token-string)' }}>
                    {command}
                  </span>
                </span>
              </code>
            </Pre>
          </Tab>
        );
      })}
    </Tabs>
  );
}
