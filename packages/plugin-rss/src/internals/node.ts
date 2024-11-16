import { promises } from 'node:fs';
import * as NodePath from 'node:path';

export async function writeFile(
  path: string,
  content: Parameters<typeof promises.writeFile>[1],
) {
  const dir = NodePath.dirname(path);
  await promises.mkdir(dir, { recursive: true });
  return promises.writeFile(path, content);
}
