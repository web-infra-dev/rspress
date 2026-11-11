import spawn from 'cross-spawn';
import getRandomPort from 'get-port';
import treeKill from 'tree-kill';

const portMap = new Map();
const expectedExits = new WeakSet<ReturnType<typeof spawn>>();

export interface CommandOptions {
  appDir: string;
  env: Record<string, string>;
}

export type Command = 'dev' | 'build' | 'preview';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runNpmScript(
  commandName: Command,
  options: CommandOptions,
  extraArgs: string[] = [],
) {
  return new Promise((resolve, reject) => {
    const commandArgs = ['--run', commandName];

    if (extraArgs.length) {
      commandArgs.push('--', ...extraArgs);
    }

    const instance = spawn(process.execPath, commandArgs, {
      cwd: options.appDir,
      env: {
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutOutput = '';
    let stderrOutput = '';
    instance.stderr!.on('data', chunk => {
      stderrOutput = (stderrOutput + chunk).slice(-64 * 1024);
    });

    let didResolve = false;

    function handleStdout(data) {
      const message = data.toString();
      stdoutOutput = (stdoutOutput + message).slice(-64 * 1024);
      const marker = commandName === 'dev' ? /built in/i : /Local:/i;

      if (commandName !== 'build' && !didResolve && marker.test(stdoutOutput)) {
        didResolve = true;
        resolve(instance);
      }
      if (process.env.RSTEST !== 'true') {
        process.stdout.write(message);
      }
    }

    instance.stdout!.on('data', handleStdout);

    instance.on('error', error => {
      didResolve = true;
      reject(error);
    });

    instance.on('close', (code, signal) => {
      instance.stdout!.removeListener('data', handleStdout);

      const error = new Error(
        `process unexpected exit with code: ${code} signal: ${signal}\nCommand ${commandName} in ${options.appDir}\n${stdoutOutput}\n${stderrOutput}`,
      );
      if (!didResolve) {
        didResolve = true;
        // Build summaries can precede plugins and final writes. Only process
        // completion confirms that the output is ready and the build succeeded.
        if (commandName === 'build' && code === 0) {
          resolve(null);
        } else {
          reject(error);
        }
      } else if (!expectedExits.has(instance)) {
        process.stderr.write(`${error.message}\n`);
      }
    });
  });
}

export async function runDevCommand(
  appDir: string,
  port: number,
  configFile?: string,
  extraArgs: string[] = [],
) {
  return runNpmScript(
    'dev',
    {
      appDir,
      env: {
        PORT: port.toString(),
        // Preview fixtures also launch an iframe server. Parallel projects must
        // not share the plugin's default port.
        RSPRESS_E2E_PREVIEW_PORT: (await getPort()).toString(),
        // FIXME: Rspack's buildDependencies should collected the dependencies of rspress.config.ts, plugins change can not trigger the cache invalidate now
        RSPRESS_PERSISTENT_CACHE: 'false',

        // FIXME: disable lazy compilation to avoid windows flaky test in rspack prerelease
        RSPRESS_LAZY_COMPILATION: 'false',
      },
    },
    [...(configFile ? ['-c', configFile] : []), ...extraArgs],
  );
}

export async function runBuildCommand(
  appDir: string,
  configFile?: string,
  extraArgs: string[] = [],
) {
  return runNpmScript(
    'build',
    {
      appDir,
      env: {},
    },
    [...(configFile ? ['-c', configFile] : []), ...extraArgs],
  );
}

export async function runPreviewCommand(
  appDir: string,
  port: number,
  extraArgs: string[] = [],
) {
  return runNpmScript(
    'preview',
    {
      appDir,
      env: {
        PORT: port.toString(),
      },
    },
    extraArgs,
  );
}

export async function getPort() {
  while (true) {
    const port = await getRandomPort();
    if (!portMap.get(port)) {
      portMap.set(port, 1);
      return port;
    }
  }
}

export async function killProcess(instance) {
  return new Promise((resolve, reject) => {
    if (
      !instance ||
      instance.exitCode !== null ||
      instance.signalCode !== null
    ) {
      resolve(null);
      return;
    }

    expectedExits.add(instance);
    treeKill(instance.pid, err => {
      if (err) {
        if (
          process.platform === 'win32' &&
          typeof err.message === 'string' &&
          (err.message.includes('no running instance of the task') ||
            err.message.includes('not found'))
        ) {
          // Windows throws an error if the process is already dead
          //
          // Command failed: taskkill /pid 6924 /T /F
          // ERROR: The process with PID 6924 (child process of PID 6736) could not be terminated.
          // Reason: There is no running instance of the task.
          return resolve(null);
        }
        return reject(err);
      }
      return resolve(null);
    });
  });
}
