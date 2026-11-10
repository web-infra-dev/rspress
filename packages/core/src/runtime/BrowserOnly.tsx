import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { safeUse } from './react';
import { safeBrowserOnly } from './reactDom';

export interface BrowserOnlyProps {
  children: () => ReactNode | Promise<ReactNode>;
  fallback?: ReactNode;
}

type DeferredSource = BrowserOnlyProps['children'] | Promise<ReactNode>;

type DeferredState =
  | { source: DeferredSource; content: ReactNode }
  | { source: DeferredSource; error: unknown };

function DeferredBrowserOnly({
  source,
  fallback = null,
}: {
  source: DeferredSource;
  fallback?: ReactNode;
}) {
  const [state, setState] = useState<DeferredState>();

  useEffect(() => {
    let isMounted = true;

    setState(undefined);

    Promise.resolve()
      .then(() => (typeof source === 'function' ? source() : source))
      .then(
        content => {
          if (isMounted) {
            setState({ source, content });
          }
        },
        error => {
          if (isMounted) {
            setState({ source, error });
          }
        },
      );

    return () => {
      isMounted = false;
    };
  }, [source]);

  if (!state || state.source !== source) {
    return fallback;
  }

  if ('error' in state) {
    throw state.error;
  }

  return state.content;
}

function ModernBrowserOnly({ children, fallback }: BrowserOnlyProps) {
  safeUse!(safeBrowserOnly!('This content is only rendered in the browser.'));

  const result = useMemo(() => {
    const content = children();

    if (
      content !== null &&
      typeof content === 'object' &&
      'then' in content &&
      typeof content.then === 'function'
    ) {
      const promise = Promise.resolve(content);
      // Handle rejection even if it happens before effects run or this render
      // is discarded. DeferredBrowserOnly still reports the error in render.
      promise.catch(() => {});
      return { promise };
    }

    return { content };
  }, [children]);

  if (result.promise) {
    return <DeferredBrowserOnly source={result.promise} fallback={fallback} />;
  }

  return <>{result.content}</>;
}

export function BrowserOnly(props: BrowserOnlyProps) {
  const { fallback = null } = props;

  // The Markdown renderer does not implement React DOM's browser bailout.
  if (import.meta.env.SSG_MD) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      {typeof safeBrowserOnly === 'function' ? (
        <ModernBrowserOnly {...props} />
      ) : (
        <DeferredBrowserOnly source={props.children} fallback={fallback} />
      )}
    </Suspense>
  );
}

export default BrowserOnly;
