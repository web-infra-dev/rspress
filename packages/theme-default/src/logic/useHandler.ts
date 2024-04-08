import { useRef } from 'react';

/**
 * Create a memoized handler function with stable reference
 */
export const useHandler = <T extends (...args: any[]) => any>(handler: T) => {
  const handlerRef = useRef<T>(handler);
  handlerRef.current = handler;
  return useRef(((...args: any[]) => handlerRef.current(...args)) as T).current;
};
