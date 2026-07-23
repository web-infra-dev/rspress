import { createHash as createHashFunc } from 'node:crypto';

export function createHash(str: string, length = 8) {
  return createHashFunc('sha256').update(str).digest('hex').slice(0, length);
}
