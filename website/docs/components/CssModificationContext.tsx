import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore,
} from 'react';

interface CssModificationEntry {
  defaultValue: string;
  currentValue: string;
}

type Listener = () => void;

class CssModificationStore {
  private entries = new Map<string, CssModificationEntry>();
  private listeners = new Map<string, Set<Listener>>();
  private globalListeners = new Set<Listener>();

  subscribe(id: string, listener: Listener): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(listener);
    return () => this.listeners.get(id)?.delete(listener);
  }

  subscribeGlobal(listener: Listener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  private notify(id: string) {
    this.listeners.get(id)?.forEach(l => l());
    this.globalListeners.forEach(l => l());
  }

  private notifyAll() {
    this.listeners.forEach(listeners => listeners.forEach(l => l()));
    this.globalListeners.forEach(l => l());
  }

  register(id: string, defaultValue: string): CssModificationEntry {
    if (this.entries.has(id)) {
      return this.entries.get(id)!;
    }
    const entry = { defaultValue, currentValue: defaultValue };
    this.entries.set(id, entry);
    return entry;
  }

  updateValue(id: string, currentValue: string) {
    const entry = this.entries.get(id);
    if (!entry || entry.currentValue === currentValue) return;
    // Create new Map to trigger useSyncExternalStore update
    const next = new Map(this.entries);
    next.set(id, { ...entry, currentValue });
    this.entries = next;
    this.notify(id);
  }

  getEntry(id: string): CssModificationEntry | undefined {
    return this.entries.get(id);
  }

  getEntries(): Map<string, CssModificationEntry> {
    return this.entries;
  }

  resetAll() {
    const next = new Map<string, CssModificationEntry>();
    this.entries.forEach((entry, id) => {
      next.set(id, { ...entry, currentValue: entry.defaultValue });
    });
    this.entries = next;
    this.notifyAll();
  }

  hasModifications(): boolean {
    for (const entry of this.entries.values()) {
      if (entry.currentValue !== entry.defaultValue) return true;
    }
    return false;
  }
}

const CssModificationContext = createContext<CssModificationStore | null>(null);

export function CssModificationProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CssModificationStore>(null);
  if (!storeRef.current) {
    storeRef.current = new CssModificationStore();
  }

  return (
    <CssModificationContext.Provider value={storeRef.current}>
      {children}
    </CssModificationContext.Provider>
  );
}

function useStore() {
  const store = useContext(CssModificationContext);
  if (!store) {
    throw new Error(
      'useCssModification must be used within CssModificationProvider',
    );
  }
  return store;
}

/**
 * Subscribe to a specific entry by styleId (only re-renders when this entry changes)
 */
export function useCssEntry(styleId: string, defaultValue: string) {
  const store = useStore();

  const registered = useRef(false);
  if (!registered.current) {
    store.register(styleId, defaultValue);
    registered.current = true;
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribe(styleId, onStoreChange),
    [store, styleId],
  );

  const getSnapshot = useCallback(
    () => store.getEntry(styleId)?.currentValue ?? defaultValue,
    [store, styleId, defaultValue],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setValue = useCallback(
    (newValue: string) => store.updateValue(styleId, newValue),
    [store, styleId],
  );

  return [value, setValue] as const;
}

/**
 * Get global modification state (for reset button, modification indicator, etc.)
 */
export function useCssModification() {
  const store = useStore();

  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeGlobal(onStoreChange),
    [store],
  );

  // Subscribe to get reactive entries snapshot
  const entries = useSyncExternalStore(
    subscribe,
    () => store.getEntries(),
    () => new Map(),
  );

  const hasModifications = useSyncExternalStore(
    subscribe,
    () => store.hasModifications(),
    () => false,
  );

  const resetAll = useCallback(() => store.resetAll(), [store]);

  return { entries, hasModifications, resetAll };
}
