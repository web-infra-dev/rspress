import fs from 'node:fs/promises';

export default async () => {
  await fs.readFile(__filename, 'utf-8');
  return {
    root: __dirname,
    title: 'my-title',
  };
};
