'use client';
// cspell:ignore preinit Preinit

import ReactDOM from 'react-dom';
import React, { useEffect, useRef } from 'react';
import type { ScriptHTMLAttributes } from 'react';
import { requestIdleCallback, setAttributesFromProps } from './utils';

const ScriptCache = new Map<string, Promise<void>>();
const LoadCache = new Set<string>();

export interface ScriptProps extends ScriptHTMLAttributes<HTMLScriptElement> {
  strategy?: 'afterInteractive' | 'lazyOnload' | 'beforeInteractive';
  id?: string;
  onLoad?: (e: any) => void;
  onReady?: () => void | null;
  onError?: (e: any) => void;
  children?: React.ReactNode;
  stylesheets?: string[];
}

const safePreinit = (
  href: string,
  options: { as: 'style' | 'script'; [key: string]: any },
) => {
  if (typeof (ReactDOM as any).preinit === 'function') {
    (ReactDOM as any).preinit(href, options);
  }
};

const safePreload = (
  href: string,
  options: { as: 'style' | 'script'; [key: string]: any },
) => {
  if (typeof (ReactDOM as any).preload === 'function') {
    (ReactDOM as any).preload(href, options);
  }
};

const insertStylesheets = (stylesheets: string[]) => {
  // Try using ReactDOM.preinit if available (React 19)
  if (typeof (ReactDOM as any).preinit === 'function') {
    stylesheets.forEach((stylesheet: string) => {
      safePreinit(stylesheet, { as: 'style' });
    });
    return;
  }

  // Fall back to standard DOM manipulation on React 18 stable client-side
  if (typeof window !== 'undefined') {
    const head = document.head;
    stylesheets.forEach((stylesheet: string) => {
      const link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = stylesheet;
      head.appendChild(link);
    });
  }
};

const loadScript = (props: ScriptProps): void => {
  const {
    src,
    id,
    onLoad = () => {},
    onReady = null,
    dangerouslySetInnerHTML,
    children = '',
    strategy = 'afterInteractive',
    onError,
    stylesheets,
  } = props;

  const cacheKey = id || src;

  // Script has already loaded
  if (cacheKey && LoadCache.has(cacheKey)) {
    return;
  }

  // Contents of this script are already loading/loaded
  if (src && ScriptCache.has(src)) {
    if (cacheKey) {
      LoadCache.add(cacheKey);
    }
    const cachedPromise = ScriptCache.get(src);
    if (cachedPromise) {
      cachedPromise.then(onLoad, onError);
    }
    return;
  }

  /** Execute after the script first loaded */
  const afterLoad = () => {
    if (onReady) {
      onReady();
    }
    if (cacheKey) {
      LoadCache.add(cacheKey);
    }
  };

  const el = document.createElement('script');

  const loadPromise = new Promise<void>((resolve, reject) => {
    el.addEventListener('load', function (e) {
      resolve();
      if (onLoad) {
        onLoad.call(this, e);
      }
      afterLoad();
    });
    el.addEventListener('error', function (e) {
      reject(e);
    });
  }).catch(function (e) {
    if (onError) {
      onError(e);
    }
  });

  if (dangerouslySetInnerHTML) {
    el.innerHTML = (dangerouslySetInnerHTML.__html as string) || '';
    afterLoad();
  } else if (children) {
    el.textContent =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? children.join('')
          : '';
    afterLoad();
  } else if (src) {
    el.src = src;
    ScriptCache.set(src, loadPromise);
  }

  setAttributesFromProps(el, props);

  el.setAttribute('data-rspress-script', strategy);

  if (stylesheets) {
    insertStylesheets(stylesheets);
  }

  document.body.appendChild(el);
};

export function handleClientScriptLoad(props: ScriptProps) {
  const { strategy = 'afterInteractive' } = props;
  if (strategy === 'lazyOnload') {
    window.addEventListener('load', () => {
      requestIdleCallback(() => loadScript(props));
    });
  } else {
    loadScript(props);
  }
}

function loadLazyScript(props: ScriptProps) {
  if (document.readyState === 'complete') {
    requestIdleCallback(() => loadScript(props));
  } else {
    window.addEventListener('load', () => {
      requestIdleCallback(() => loadScript(props));
    });
  }
}

function addBeforeInteractiveToCache() {
  if (typeof document === 'undefined') return;
  const scripts = document.querySelectorAll(
    '[data-rspress-script="beforeInteractive"]',
  );
  scripts.forEach(script => {
    const cacheKey = script.id || script.getAttribute('src');
    if (cacheKey) {
      LoadCache.add(cacheKey);
    }
  });
}

export function initScriptLoader(scriptLoaderItems: ScriptProps[]) {
  addBeforeInteractiveToCache();
  scriptLoaderItems.forEach(handleClientScriptLoad);
}

/**
 * Load third-party scripts in an optimized way inside Rspress (SSG/React).
 */
export function Script(props: ScriptProps): React.JSX.Element | null {
  const {
    id,
    src = '',
    onLoad = () => {},
    onReady = null,
    strategy = 'afterInteractive',
    onError,
    stylesheets,
    nonce,
    dangerouslySetInnerHTML,
    children,
    ...restProps
  } = props;

  const hasOnReadyEffectCalled = useRef(false);

  // Run onReady if script has loaded before but component is re-mounted
  useEffect(() => {
    const cacheKey = id || src;
    if (!hasOnReadyEffectCalled.current) {
      if (onReady && cacheKey && LoadCache.has(cacheKey)) {
        onReady();
      }
      hasOnReadyEffectCalled.current = true;
    }
  }, [onReady, id, src]);

  const hasLoadScriptEffectCalled = useRef(false);

  // Load scripts post-hydration or on-mount for browser strategies
  useEffect(() => {
    if (!hasLoadScriptEffectCalled.current) {
      addBeforeInteractiveToCache();

      if (strategy === 'afterInteractive') {
        loadScript(props);
      } else if (strategy === 'lazyOnload') {
        loadLazyScript(props);
      } else if (strategy === 'beforeInteractive') {
        // Client-side fallback check in case the script didn't execute during the static SSR render
        loadScript(props);
      }
      hasLoadScriptEffectCalled.current = true;
    }
  }, [props, strategy]);

  // Optimize stylesheet resource preloading dynamically on React 19
  if (stylesheets) {
    stylesheets.forEach(styleSrc => {
      safePreinit(styleSrc, { as: 'style' });
    });
  }

  // Server-Side Rendering (SSG) build phase
  if (typeof window === 'undefined') {
    // Optimize preloading using React 19 APIs if available
    if (
      src &&
      (strategy === 'beforeInteractive' || strategy === 'afterInteractive')
    ) {
      safePreload(
        src,
        restProps.integrity
          ? {
              as: 'script',
              integrity: restProps.integrity,
              nonce,
              crossOrigin: restProps.crossOrigin,
            }
          : { as: 'script', nonce, crossOrigin: restProps.crossOrigin },
      );
    }

    // Render standard native script tags during build-time (SSR) for beforeInteractive
    if (strategy === 'beforeInteractive') {
      if (!src) {
        // Inline script handling
        const innerHTML = dangerouslySetInnerHTML
          ? (dangerouslySetInnerHTML.__html as string)
          : typeof children === 'string'
            ? children
            : Array.isArray(children)
              ? children.join('')
              : '';

        return (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: innerHTML }}
            data-rspress-script="beforeInteractive"
            {...restProps}
          />
        );
      } else {
        // External script handling
        return (
          <script
            src={src}
            nonce={nonce}
            data-rspress-script="beforeInteractive"
            {...restProps}
          />
        );
      }
    }

    return null;
  }

  return null;
}
