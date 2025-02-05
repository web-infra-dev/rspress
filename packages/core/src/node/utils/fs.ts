import fs from 'node:fs/promises';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(path: string): Promise<any> {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}
