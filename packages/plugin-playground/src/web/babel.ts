import type babel from '@babel/standalone';

type Babel = typeof babel;

declare global {
  interface Window {
    Babel: Babel;
  }
  const __PLAYGROUND_BABEL_URL__: string;
}

// see https://github.com/web-infra-dev/rspress/issues/876
async function loadUmdBabelModule(): Promise<Babel> {
  const data = await fetch(__PLAYGROUND_BABEL_URL__);

  const umdSourceCode = await data.text();

  const run = new Function(
    'exports',
    'module',
    'require',
    `with(exports, module, require) {${umdSourceCode}}`,
  );

  const exports: Babel = {} as unknown as Babel;
  const module = { exports };
  const require = () => {};

  run(exports, module, require);

  return exports;
}

let loadBabelPromise: null | Promise<Babel> = null;

async function getBabel(): Promise<Babel> {
  if (window.Babel) {
    return window.Babel;
  }
  if (loadBabelPromise) {
    return loadBabelPromise;
  }

  loadBabelPromise = loadUmdBabelModule();
  try {
    const Babel = await loadBabelPromise;
    window.Babel = Babel;
    return Babel;
  } catch (e) {
    loadBabelPromise = null;
    throw e;
  }
}

export { getBabel };
