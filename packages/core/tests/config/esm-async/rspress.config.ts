import fs from 'node:fs/promises';

export default async () => {
  await fs.readFile(import.meta.filename, 'utf-8');
  return {
    root: import.meta.dirname,
    title: 'my-title',
  };
};
