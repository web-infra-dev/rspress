import { useCallback, useSyncExternalStore } from 'react';

const SYNC_STORAGE_EVENT_NAME = 'RSPRESS_SYNC_STORAGE_EVENT_NAME';

const getStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn(
      `[useStorageValue] Failed to set localStorage key "${key}":`,
      error,
    );
  }
};

export type StorageAction<T> = T | ((prevState: T) => T);

/**
 * Read/update the value in localStorage, and keeping it in sync with other tabs.
 * @internal
 */
export const useStorageValue = <T>(key: string, defaultValue: T) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleStorage = (event: StorageEvent) => {
        // event.key === null handles localStorage.clear()
        if (event.key === key || event.key === null) {
          onStoreChange();
        }
      };

      const handleCustomEvent = (event: Event) => {
        const customEvent = event as CustomEvent<{ key: string }>;
        if (customEvent.detail?.key === key) {
          onStoreChange();
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener(SYNC_STORAGE_EVENT_NAME, handleCustomEvent);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener(SYNC_STORAGE_EVENT_NAME, handleCustomEvent);
      };
    },
    [key],
  );

  const getSnapshot = useCallback((): T => {
    const raw = getStorageItem(key);
    return (raw !== null ? raw : defaultValue) as T;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback((): T => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (action: StorageAction<T>) => {
      const currentStored = getStorageItem(key);
      const currentValue = (
        currentStored !== null ? currentStored : defaultValue
      ) as T;

      const nextValue =
        typeof action === 'function'
          ? (action as (prevState: T) => T)(currentValue)
          : action;

      if (nextValue == null) {
        setStorageItem(key, null);
      } else {
        setStorageItem(key, String(nextValue));
      }

      // Synchronously notify all instances of this hook across the current page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent<{ key: string; newValue: T }>(
            SYNC_STORAGE_EVENT_NAME,
            {
              detail: {
                key,
                newValue: nextValue,
              },
            },
          ),
        );
      }
    },
    [key, defaultValue],
  );

  return [value, setValue] as const;
};
