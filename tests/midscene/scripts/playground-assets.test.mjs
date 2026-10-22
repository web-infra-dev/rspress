import assert from 'node:assert/strict';
import test from 'node:test';
import { playgroundAsset, playgroundAssetPath } from './playground-assets.ts';

test('playground uses the original pinned Babel and Monaco assets without CDN requests', async () => {
  for (const pathname of [
    '/ajax/libs/babel-standalone/7.22.20/babel.min.js',
    '/ajax/libs/monaco-editor/0.43.0/min/vs/loader.js',
    '/ajax/libs/monaco-editor/0.43.0/min/vs/editor/editor.main.css',
  ]) {
    const asset = await playgroundAsset(
      new URL('https://cdnjs.cloudflare.com' + pathname),
    );
    assert(asset.body.length > 100);
    assert(['text/javascript', 'text/css'].includes(asset.contentType));
  }
});

test('playground asset routing rejects other hosts, versions, query strings, and path traversal', () => {
  for (const url of [
    'https://example.com/ajax/libs/babel-standalone/7.22.20/babel.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.22.20/babel.min.js?data=anything',
    'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.55.1/min/vs/loader.js',
    'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.43.0/min/vs/%2e%2e%2fpackage.json',
  ]) {
    assert.equal(playgroundAssetPath(new URL(url)), undefined);
  }
});
