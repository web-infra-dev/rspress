import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const SYNC_STORAGE_EVENT_NAME = 'RSPRESS_SYNC_STORAGE_EVENT_NAME';

/**
 * Read/update the value in localStorage, and keeping it in sync with other tabs.
 * @internal
 */
export const useStorageValue = <T>(key: string, defaultValue: T) => {
  const [value, setValueInternal] = useState<T>(defaultValue);
  // TODO: support SSR
  useLayoutEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue != null) {
      setValueInternal(storedValue as T);
    }
  }, []);

  const setValue = useCallback(
    (value: T) => {
      const next = value;
      if (next == null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, next.toString());
      }
      setValueInternal(next);
      dispatchEvent(
        // send custom event to communicate within same page
        // importantly this should not be a StorageEvent since those cannot
        // be constructed with a non-built-in storage area
        new CustomEvent<{ key: string; newValue: T }>(SYNC_STORAGE_EVENT_NAME, {
          detail: {
            key,
            newValue: next,
          },
        }),
      );
    },
    [key],
  );

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === key) {
        setValueInternal((localStorage.getItem(key) as T) ?? defaultValue);
      }
    };
    window.addEventListener('storage', listener);
    return () => {
      window.removeEventListener('storage', listener);
    };
  }, [key, defaultValue]);

  // from same page
  useEffect(() => {
    const listener = (e: CustomEvent) => {
      const { key: eventKey, newValue } = e.detail;
      if (eventKey === key) {
        setValueInternal((newValue as T) ?? defaultValue);
      }
    };
    window.addEventListener(SYNC_STORAGE_EVENT_NAME, listener as EventListener);
    return () => {
      window.removeEventListener(
        SYNC_STORAGE_EVENT_NAME,
        listener as EventListener,
      );
    };
  }, []);

  return [value, setValue] as const;
};
