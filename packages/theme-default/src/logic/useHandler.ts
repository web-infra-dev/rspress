import type { AnyFunction } from '@rspress/shared';
import { useRef } from 'react';

/**
 * Create a memoized handler function with stable reference
 */
export const useHandler = <T extends AnyFunction>(handler: T) => {
  const handlerRef = useRef<T>(handler);
  handlerRef.current = handler;
  return useRef(
    ((...args: Parameters<T>): ReturnType<T> =>
      handlerRef.current(...args)) as T,
  ).current;
};
