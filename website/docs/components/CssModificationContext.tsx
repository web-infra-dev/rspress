import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface CssModificationEntry {
  defaultValue: string;
  currentValue: string;
}

interface CssModificationContextType {
  entries: Map<string, CssModificationEntry>;
  register: (
    id: string,
    defaultValue: string,
    currentValue?: string,
  ) => CssModificationEntry;
  updateValue: (id: string, currentValue: string) => void;
  resetAll: () => void;
  hasModifications: boolean;
  getEntry: (id: string) => CssModificationEntry | undefined;
}

const CssModificationContext = createContext<CssModificationContextType | null>(
  null,
);

export function CssModificationProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Map<string, CssModificationEntry>>(
    new Map(),
  );

  const register = useCallback(
    (
      id: string,
      defaultValue: string,
      currentValue?: string,
    ): CssModificationEntry => {
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
          currentValue: currentValue ?? defaultValue,
        };
        const next = new Map(prev);
        next.set(id, entry);
        return next;
      });

      // Return existing or new entry
      return (
        entry ?? { defaultValue, currentValue: currentValue ?? defaultValue }
      );
    },
    [],
  );

  const updateValue = useCallback((id: string, currentValue: string) => {
    setEntries(prev => {
      const entry = prev.get(id);
      if (!entry) return prev;

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
        resetAll,
        hasModifications,
        getEntry,
      }}
    >
      {children}
    </CssModificationContext.Provider>
  );
}

export function useCssModification() {
  const context = useContext(CssModificationContext);
  if (!context) {
    throw new Error(
      'useCssModification must be used within CssModificationProvider',
    );
  }
  return context;
}
