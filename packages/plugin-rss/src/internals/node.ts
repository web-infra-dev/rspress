import { mkdir, writeFile as _writeFile } from 'node:fs/promises';
import * as NodePath from 'node:path';

export async function writeFile(path: string, content: string | Buffer) {
  const dir = NodePath.dirname(path);
  await mkdir(dir, { mode: 0o755, recursive: true });
  return _writeFile(path, content);
}
