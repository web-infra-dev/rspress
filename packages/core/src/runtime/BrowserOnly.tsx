import type { ReactNode } from 'react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { safeUse } from './react';
import { safeBrowserOnly } from './reactDom';

export interface BrowserOnlyProps {
  children: () => ReactNode | Promise<ReactNode>;
  fallback?: ReactNode;
}

type BrowserOnlyState =
  | {
      status: 'pending';
      children: BrowserOnlyProps['children'];
    }
  | {
      status: 'resolved';
      children: BrowserOnlyProps['children'];
      content: ReactNode;
    }
  | {
      status: 'rejected';
      children: BrowserOnlyProps['children'];
      error: unknown;
    };

function DeferredBrowserOnly(props: BrowserOnlyProps) {
  const { children, fallback = null } = props;
  const [state, setState] = useState<BrowserOnlyState>({
    status: 'pending',
    children,
  });

  useEffect(() => {
    let isMounted = true;

    setState({ status: 'pending', children });

    Promise.resolve()
      .then(() => children())
      .then(
        content => {
          if (isMounted) {
            setState({ status: 'resolved', children, content });
          }
        },
        error => {
          if (isMounted) {
            setState({ status: 'rejected', children, error });
          }
        },
      );

    return () => {
      isMounted = false;
    };
  }, [children]);

  if (state.children !== children) {
    return fallback;
  }

  if (state.status === 'rejected') {
    throw state.error;
  }

  if (state.status === 'resolved') {
    return state.content;
  }

  return fallback;
}

function ModernBrowserOnly({ children, fallback }: BrowserOnlyProps) {
  safeUse!(safeBrowserOnly!());

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
      return { asyncChildren: () => promise };
    }

    return { content };
  }, [children]);

  if (result.asyncChildren) {
    return (
      <DeferredBrowserOnly fallback={fallback}>
        {result.asyncChildren}
      </DeferredBrowserOnly>
    );
  }

  return <>{result.content}</>;
}

export function BrowserOnly(props: BrowserOnlyProps) {
  const { fallback = null } = props;

  // The Markdown renderer does not implement React DOM's browser bailout.
  if (import.meta.env.SSG_MD) {
    return <>{fallback}</>;
  }

  const Content =
    typeof safeBrowserOnly === 'function'
      ? ModernBrowserOnly
      : DeferredBrowserOnly;

  return (
    <Suspense fallback={fallback}>
      <Content {...props} />
    </Suspense>
  );
}

export default BrowserOnly;
