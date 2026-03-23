import net from 'node:net';
import { pluginLogger } from './logger';

const MAX_PORT_OFFSET = 20;

function isPortAvailable(port: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', err => {
      if (server.listening) {
        server.close(() => reject(err));
      } else {
        reject(err);
      }
    });
    server.listen({ port, host: '0.0.0.0' }, () => {
      server.close(err => (err ? reject(err) : resolve()));
    });
  });
}

export async function resolveAvailablePort(devPort: number): Promise<number> {
  const maxPort = devPort + MAX_PORT_OFFSET;
  for (let candidate = devPort; candidate <= maxPort; candidate++) {
    try {
      await isPortAvailable(candidate);
      if (candidate !== devPort) {
        pluginLogger.info(
          `Port ${devPort} is in use, using port ${candidate} instead.`,
        );
      }
      return candidate;
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'EADDRINUSE') {
        throw e;
      }
    }
  }
  throw new Error(
    `[@rspress/plugin-preview] Could not find an available port between ${devPort} and ${maxPort}.`,
  );
}
