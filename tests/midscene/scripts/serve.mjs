import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL('../../../packages/core/bin/rspress.js', import.meta.url),
    ),
    'dev',
    '--host',
    '127.0.0.1',
    '--port',
    process.env.FIXTURE_PORT ?? '4173',
  ],
  {
    cwd: fileURLToPath(new URL('../fixture', import.meta.url)),
    stdio: 'inherit',
  },
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
