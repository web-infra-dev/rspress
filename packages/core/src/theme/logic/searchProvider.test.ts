import { afterEach, describe, expect, test } from '@rstest/core';
import {
  getSearchProvider,
  registerSearchProvider,
  type SearchProvider,
} from './searchProvider';

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) {
    cleanup();
  }
});

function provider(name: string): SearchProvider {
  return {
    search: async () => [{ group: name, result: [] }],
  };
}

describe('search providers', () => {
  test('uses the most recently registered provider', () => {
    const first = provider('first');
    const second = provider('second');
    const unregisterFirst = registerSearchProvider(first);
    const unregisterSecond = registerSearchProvider(second);
    cleanups.push(unregisterFirst, unregisterSecond);

    expect(getSearchProvider()).toBe(second);
    unregisterSecond();
    expect(getSearchProvider()).toBe(first);
  });

  test('supports idempotent cleanup', () => {
    const searchProvider = provider('provider');
    const unregister = registerSearchProvider(searchProvider);
    cleanups.push(unregister);

    unregister();
    unregister();
    expect(getSearchProvider()).toBeUndefined();
  });
});
