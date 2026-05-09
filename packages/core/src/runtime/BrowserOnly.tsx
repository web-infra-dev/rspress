import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

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

export function BrowserOnly(props: BrowserOnlyProps) {
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

export default BrowserOnly;
