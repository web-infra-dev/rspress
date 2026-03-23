import net from 'node:net';
import { pluginLogger } from './logger';

const MAX_PORT_OFFSET = 20;

export async function resolveAvailablePort(devPort: number): Promise<number> {
  const maxPort = devPort + MAX_PORT_OFFSET;
  for (let candidate = devPort; candidate <= maxPort; candidate++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on('error', reject);
        server.listen({ port: candidate, host: '0.0.0.0' }, () => {
          server.close(() => resolve());
        });
      });
      if (candidate !== devPort) {
        pluginLogger.info(
          `Port ${devPort} is in use, using port ${candidate} instead.`,
        );
      }
      return candidate;
    } catch (e) {
      if (
        !!e &&
        typeof e === 'object' &&
        'code' in e &&
        e.code !== 'EADDRINUSE'
      ) {
        throw e;
      }
    }
  }
  throw new Error(
    `[@rspress/plugin-preview] Could not find an available port between ${devPort} and ${maxPort}.`,
  );
}
