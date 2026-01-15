import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface CssModificationEntry {
  defaultValue: string;
  currentValue: string;
}

interface CssModificationContextType {
  entries: Map<string, CssModificationEntry>;
  register: (id: string, defaultValue: string) => CssModificationEntry;
  updateValue: (id: string, currentValue: string) => void;
  getEntry: (id: string) => CssModificationEntry | undefined;
  resetAll: () => void;
  hasModifications: boolean;
}

const CssModificationContext = createContext<CssModificationContextType | null>(
  null,
);

export function CssModificationProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, CssModificationEntry>>(
    new Map(),
  );

  const register = useCallback(
    (id: string, defaultValue: string): CssModificationEntry => {
      let entry: CssModificationEntry | undefined;

      setEntries(prev => {
        // If entry already exists, return it without modification
        if (prev.has(id)) {
          entry = prev.get(id)!;
          return prev;
        }

        // Create new entry
        entry = {
          defaultValue,
          currentValue: defaultValue,
        };
        const next = new Map(prev);
        next.set(id, entry);
        return next;
      });

      // Return existing or new entry
      return entry ?? { defaultValue, currentValue: defaultValue };
    },
    [],
  );

  const updateValue = useCallback((id: string, currentValue: string) => {
    setEntries(prev => {
      const entry = prev.get(id);
      if (!entry || entry.currentValue === currentValue) return prev;

      const next = new Map(prev);
      next.set(id, { ...entry, currentValue });
      return next;
    });
  }, []);

  const getEntry = useCallback(
    (id: string): CssModificationEntry | undefined => {
      return entries.get(id);
    },
    [entries],
  );

  const resetAll = useCallback(() => {
    // Reset all entries to defaultValue - CssStyleSync will handle DOM syncing
    setEntries(prev => {
      const next = new Map<string, CssModificationEntry>();
      prev.forEach((entry, id) => {
        next.set(id, { ...entry, currentValue: entry.defaultValue });
      });
      return next;
    });
  }, []);

  // Check if any entry has modifications
  const hasModifications = Array.from(entries.values()).some(
    entry => entry.currentValue !== entry.defaultValue,
  );

  return (
    <CssModificationContext.Provider
      value={{
        entries,
        register,
        updateValue,
        getEntry,
        resetAll,
        hasModifications,
      }}
    >
      {children}
    </CssModificationContext.Provider>
  );
}

/**
 * Hook to manage CSS modification state for a specific editor.
 * Similar to useState but synced with global context.
 * @param id - Unique identifier for this CSS editor
 * @param initialValue - The default CSS value
 * @returns [currentValue, setValue] - Current value and setter function
 */
export function useCssModification(
  id: string,
  initialValue: string,
): [string, (value: string) => void] {
  const context = useContext(CssModificationContext);
  if (!context) {
    throw new Error(
      'useCssModification must be used within CssModificationProvider',
    );
  }

  const { register, updateValue, getEntry } = context;

  // Register on first render
  const [localValue, setLocalValue] = useState(() => {
    const entry = register(id, initialValue);
    return entry.currentValue;
  });

  // Update context when local value changes
  useEffect(() => {
    updateValue(id, localValue);
  }, [id, localValue, updateValue]);

  // Sync from context (e.g., after resetAll)
  useEffect(() => {
    const entry = getEntry(id);
    if (entry && entry.currentValue !== localValue) {
      setLocalValue(entry.currentValue);
    }
  }, [id, getEntry, localValue]);

  return [localValue, setLocalValue];
}

/**
 * Hook to access global CSS modification state.
 * @returns { hasModifications, resetAll }
 */
export function useAllCssModification() {
  const context = useContext(CssModificationContext);
  if (!context) {
    throw new Error(
      'useAllCssModification must be used within CssModificationProvider',
    );
  }

  return {
    hasModifications: context.hasModifications,
    resetAll: context.resetAll,
    entries: context.entries,
  };
}
