import getRandomPort from 'get-port';
import spawn from 'cross-spawn';
import treeKill from 'tree-kill';

const portMap = new Map();

export interface CommandOptions {
  appDir: string;
  env: Record<string, string>;
}

export type Command = 'dev' | 'build' | 'preview';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runCommand(
  commandName: Command,
  options: CommandOptions,
) {
  return new Promise((resolve, reject) => {
    const instance = spawn('npm', ['run', commandName], {
      cwd: options.appDir,
      env: {
        TEST: '1',
        ...process.env,
        ...options.env,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrOutput = '';
    instance.stderr!.on('data', chunk => {
      stderrOutput += chunk;
    });

    let didResolve = false;

    async function handleStdout(data) {
      const message = data.toString();
      const bootupMarkers = {
        dev: /compiled/i,
        preview: /Network:/i,
        build: /Pages rendered/,
      };

      if (bootupMarkers[commandName].test(message)) {
        if (!didResolve) {
          didResolve = true;
          resolve(instance);
        }
      }
      process.stdout.write(message);
    }

    instance.stdout!.on('data', handleStdout);

    instance.on('error', error => {
      reject(error);
      process.stderr.write(stderrOutput);
    });

    instance.on('close', () => {
      instance.stdout!.removeListener('data', handleStdout);
      if (!didResolve) {
        didResolve = true;
        resolve(null);
      }
    });
  });
}

export async function runDevCommand(appDir: string, port: number) {
  return runCommand('dev', {
    appDir,
    env: {
      PORT: port.toString(),
    },
  });
}

export async function runBuildCommand(appDir: string) {
  return runCommand('build', {
    appDir,
    env: {},
  });
}

export async function runPreviewCommand(appDir: string, port: number) {
  return runCommand('preview', {
    appDir,
    env: {
      PORT: port.toString(),
    },
  });
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
    if (!instance) {
      resolve(null);
    }

    treeKill(instance.pid, err => {
      if (err) {
        if (
          process.platform === 'win32' &&
          typeof err.message === 'string' &&
          (err.message.includes(`no running instance of the task`) ||
            err.message.includes(`not found`))
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
