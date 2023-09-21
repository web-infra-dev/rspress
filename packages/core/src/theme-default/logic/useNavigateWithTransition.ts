import { useNavigate, NavigateFunction } from 'react-router-dom';
import { flushSync } from 'react-dom';

declare global {
  interface Document {
    startViewTransition: (callback: () => void) => void;
  }
}

export function useNavigateWithTransition(): NavigateFunction {
  const navigate = useNavigate();
  const wrappedNavigate = (...args) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => {
          navigate.call(null, ...args);
        });
      });
    } else {
      navigate.call(null, ...args);
    }
  };
  return wrappedNavigate;
}
