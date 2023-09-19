import type babel from '@babel/standalone';

declare global {
  // inject by builder in cli/index.ts
  // see: https://modernjs.dev/builder/api/config-source.html#sourcedefine
  const __PLAYGROUND_BABEL_URL__: any;
  interface Window {
    Babel: typeof babel;
  }
}

function loadScript(url: string): Promise<void> {
  return new Promise(resolve => {
    const e = document.createElement('script');
    e.src = url;
    e.onload = () => resolve();
    document.body.appendChild(e);
  });
}

async function getBabel() {
  if (!window.Babel) {
    let babelUrl =
      'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.22.20/babel.min.js';
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
