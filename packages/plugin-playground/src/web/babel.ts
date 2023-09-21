import type babel from '@babel/standalone';
import { DEFAULT_BABEL_URL } from './constant';
import { loadScript } from './utils';

declare global {
  // inject by builder in cli/index.ts
  // see: https://modernjs.dev/builder/api/config-source.html#sourcedefine
  const __PLAYGROUND_BABEL_URL__: any;
  interface Window {
    Babel: typeof babel;
  }
}

async function getBabel() {
  if (!window.Babel) {
    let babelUrl = DEFAULT_BABEL_URL;
    try {
      const u = __PLAYGROUND_BABEL_URL__;
      if (u) {
        babelUrl = u;
      }
    } catch (e) {
      // ignore
    }
    await loadScript(babelUrl);
  }
  return window.Babel;
}

export { getBabel };
