import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const monacoRoot = path.join(
  path.dirname(require.resolve('monaco-editor/package.json')),
  'min/vs',
);
const babelFile = require.resolve('@babel/standalone/babel.min.js');
const monacoPrefix = '/ajax/libs/monaco-editor/0.43.0/min/vs/';

export function playgroundAssetPath(url: URL): string | undefined {
  if (url.origin !== 'https://cdnjs.cloudflare.com' || url.search) return;
  if (url.pathname === '/ajax/libs/babel-standalone/7.22.20/babel.min.js')
    return babelFile;
  if (!url.pathname.startsWith(monacoPrefix)) return;
  const relative = decodeURIComponent(url.pathname.slice(monacoPrefix.length));
  const filename = path.resolve(monacoRoot, relative);
  if (!filename.startsWith(monacoRoot + path.sep)) return;
  return filename;
}

export async function playgroundAsset(url: URL) {
  const filename = playgroundAssetPath(url);
  if (!filename) return;
  const contentType = filename.endsWith('.js')
    ? 'text/javascript'
    : filename.endsWith('.css')
      ? 'text/css'
      : 'application/octet-stream';
  return { body: await readFile(filename), contentType };
}
