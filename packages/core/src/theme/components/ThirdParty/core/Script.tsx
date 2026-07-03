'use client';
// cspell:ignore preinit Preinit

import ReactDOM from 'react-dom';
import React, { useEffect, useRef } from 'react';
import type { ScriptHTMLAttributes } from 'react';
import { requestIdleCallback, setAttributesFromProps } from './utils';

// Cache to prevent duplicate loads of the same network scripts
const ScriptCache = new Map<string, Promise<Event>>();
const LoadCache = new Set<string>();

// Deduplication tracker for React 18 stylesheets
const insertedStylesheets = new Set<string>();

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
  const preinitFn =
    (ReactDOM as any).preinit || (ReactDOM as any).experimental_preinit;
  if (typeof preinitFn === 'function') {
    preinitFn(href, options);
  }
};

const safePreload = (
  href: string,
  options: { as: 'style' | 'script'; [key: string]: any },
) => {
  const preloadFn =
    (ReactDOM as any).preload || (ReactDOM as any).experimental_preload;
  if (typeof preloadFn === 'function') {
    preloadFn(href, options);
  }
};

const insertStylesheets = (stylesheets: string[]) => {
  // Use ReactDOM.preinit if available (React 19)
  const preinitFn =
    (ReactDOM as any).preinit || (ReactDOM as any).experimental_preinit;
  if (typeof preinitFn === 'function') {
    stylesheets.forEach((stylesheet: string) => {
      safePreinit(stylesheet, { as: 'style' });
    });
    return;
  }

  // Fall back to standard DOM manipulation on React 18 client-side
  if (typeof window !== 'undefined') {
    const head = document.head;
    stylesheets.forEach((stylesheet: string) => {
      if (insertedStylesheets.has(stylesheet)) return;

      // Prevent appending duplicates to document head
      if (head.querySelector(`link[href="${stylesheet}"]`)) {
        insertedStylesheets.add(stylesheet);
        return;
      }

      const link = document.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = stylesheet;
      head.appendChild(link);

      insertedStylesheets.add(stylesheet);
    });
  }
};

const loadScript = (props: ScriptProps): void => {
  const {
    src,
    id,
    onLoad,
    onReady = null,
    dangerouslySetInnerHTML,
    children = '',
    strategy = 'afterInteractive',
    onError,
    stylesheets,
    ...restProps
  } = props;

  const cacheKey = id || src;

  // Exit if the script has already finished loading
  if (cacheKey && LoadCache.has(cacheKey)) {
    return;
  }

  const afterLoad = () => {
    if (onReady) {
      onReady();
    }
    if (cacheKey) {
      LoadCache.add(cacheKey);
    }
  };

  // If this script is already in the process of loading, chain callbacks
  if (src && ScriptCache.has(src)) {
    if (cacheKey) {
      LoadCache.add(cacheKey);
    }
    const cachedPromise = ScriptCache.get(src);
    if (cachedPromise) {
      cachedPromise.then(e => {
        if (onLoad) {
          onLoad(e);
        }
        afterLoad();
      }, onError);
    }
    return;
  }

  const el = document.createElement('script');

  const loadPromise = new Promise<Event>((resolve, reject) => {
    el.addEventListener('load', function (e) {
      resolve(e);
      if (onLoad) {
        onLoad.call(this, e);
      }
      afterLoad();
    });
    el.addEventListener('error', function (e) {
      // Remove from cache on load failure so subsequent attempts can retry
      if (src) {
        ScriptCache.delete(src);
      }
      reject(e);
    });
  });

  loadPromise.catch(e => {
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

  // Prevent invalid HTML attribute pollution by only passing standard props
  setAttributesFromProps(el, restProps);

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
    onLoad,
    onReady = null,
    strategy = 'afterInteractive',
    onError,
    stylesheets,
    nonce,
    dangerouslySetInnerHTML,
    children,
    ...restProps
  } = props;

  const cacheKey = id || src;
  const lastLoadedSrcOrId = useRef<string | null>(null);

  // Run onReady if script has loaded before, or if the script is updated dynamically
  useEffect(() => {
    if (lastLoadedSrcOrId.current !== cacheKey) {
      if (onReady && cacheKey && LoadCache.has(cacheKey)) {
        onReady();
      }
      lastLoadedSrcOrId.current = cacheKey;
    }
  }, [onReady, cacheKey]);

  const lastInitializedKey = useRef<string | null>(null);
  const inlineContent =
    dangerouslySetInnerHTML?.__html ||
    (typeof children === 'string' ? children : '');

  // Load scripts post-hydration or on-mount for browser strategies
  useEffect(() => {
    if (lastInitializedKey.current !== cacheKey) {
      addBeforeInteractiveToCache();

      if (strategy === 'afterInteractive') {
        loadScript(props);
      } else if (strategy === 'lazyOnload') {
        loadLazyScript(props);
      } else if (strategy === 'beforeInteractive') {
        // Fallback execution check
        loadScript(props);
      }
      lastInitializedKey.current = cacheKey;
    }
  }, [cacheKey, strategy, inlineContent]);

  // Optimize stylesheet resource preloading dynamically on React 19
  if (stylesheets) {
    stylesheets.forEach(styleSrc => {
      safePreinit(styleSrc, { as: 'style' });
    });
  }

  // Server-Side Rendering (SSG) build phase
  if (typeof window === 'undefined') {
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

    if (strategy === 'beforeInteractive') {
      if (!src) {
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
