import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

export interface BrowserOnlyProps {
  children: () => ReactNode | Promise<ReactNode>;
  fallback?: ReactNode;
}

type BrowserOnlyState =
  | {
      status: 'pending';
    }
  | {
      status: 'resolved';
      content: ReactNode;
    }
  | {
      status: 'rejected';
      error: unknown;
    };

export function BrowserOnly(props: BrowserOnlyProps) {
  const { children, fallback = null } = props;
  const childrenRef = useRef(children);
  const [state, setState] = useState<BrowserOnlyState>({
    status: 'pending',
  });

  childrenRef.current = children;

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => childrenRef.current())
      .then(
        content => {
          if (isMounted) {
            setState({ status: 'resolved', content });
          }
        },
        error => {
          if (isMounted) {
            setState({ status: 'rejected', error });
          }
        },
      );

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === 'rejected') {
    throw state.error;
  }

  if (state.status === 'resolved') {
    return state.content;
  }

  return fallback;
}

export default BrowserOnly;
