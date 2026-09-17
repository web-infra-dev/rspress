import { useSyncExternalStore } from 'react';

export interface SearchResultGroup<TResult = unknown> {
  group: string;
  result: TResult;
}

export interface SearchProvider {
  search: (query: string, limit?: number) => Promise<SearchResultGroup[]>;
}

const providers: SearchProvider[] = [];
const listeners = new Set<() => void>();

export function getSearchProvider(): SearchProvider | undefined {
  return providers.at(-1);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function registerSearchProvider(provider: SearchProvider): () => void {
  providers.push(provider);
  notify();

  return () => {
    const index = providers.lastIndexOf(provider);
    if (index === -1) {
      return;
    }

    const wasActive = index === providers.length - 1;
    providers.splice(index, 1);
    if (wasActive) {
      notify();
    }
  };
}

export function useSearchProvider(): SearchProvider | undefined {
  return useSyncExternalStore(subscribe, getSearchProvider, getSearchProvider);
}
