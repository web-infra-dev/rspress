import { useSyncExternalStore } from 'react';

export function createExternalStore<T>(initialValue: T) {
  let value = initialValue;
  const listeners = new Set<() => void>();
  const getSnapshot = () => value;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    update(nextValue: T) {
      value = nextValue;
      for (const listener of listeners) {
        listener();
      }
    },
    useValue() {
      return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    },
  };
}
