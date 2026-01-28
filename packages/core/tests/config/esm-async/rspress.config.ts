import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async () => {
  await fs.readFile(__filename, 'utf-8');
  return {
    root: __dirname,
    title: 'my-title',
  };
};
