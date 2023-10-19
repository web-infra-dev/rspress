import type babel from '@babel/standalone';

type Babel = typeof babel;

declare global {
  interface Window {
    Babel: Babel;
  }
}

function getBabel(): Babel | Promise<Babel> {
  if (window.Babel) {
    return window.Babel;
  }
  const el = document.getElementById('rspress-playground-babel');
  if (!el) {
    throw new Error('Babel not found');
  }
  return new Promise(resolve => {
    el.addEventListener('load', () => {
      resolve(window.Babel);
    });
  });
}

export { getBabel };
