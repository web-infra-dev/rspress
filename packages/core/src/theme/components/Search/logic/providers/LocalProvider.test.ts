import type { PageIndexInfo } from '@rspress/core';
import { describe, expect, rstest, test } from '@rstest/core';

interface MockAddRecord {
  id: string;
  settled: boolean;
}

interface FlexSearchMockState {
  pendingAdds: MockAddRecord[];
}

// FlexSearch resolves addAsync through an internal async queue, so searching
// immediately after unawaited adds can still find documents. To make the
// contract observable, replace Document with a mock whose addAsync settles in
// a later macrotask and records whether init() waited for it.
rstest.mock('flexsearch', () => {
  const globalState = globalThis as unknown as {
    __flexSearchMockState?: FlexSearchMockState;
  };
  globalState.__flexSearchMockState ??= { pendingAdds: [] };

  class Document {
    addAsync(id: string): Promise<void> {
      const state = globalState.__flexSearchMockState!;
      const record: MockAddRecord = { id, settled: false };
      state.pendingAdds.push(record);
      return new Promise(resolve => {
        setTimeout(() => {
          record.settled = true;
          resolve();
        }, 0);
      });
    }

    searchAsync(): Promise<unknown[]> {
      return Promise.resolve([]);
    }
  }

  return { Document };
});

rstest.mock('virtual-page-data', () => ({ searchIndexHash: {} }));

import { LocalProvider } from './LocalProvider';

function createPage(index: number): PageIndexInfo {
  return {
    routePath: `/page-${index}`,
    title: `Page ${index}`,
    toc: [],
    content: `content of page ${index}`,
    frontmatter: {},
    lang: 'en',
    version: '',
    _filepath: `/page-${index}.md`,
    _relativePath: `page-${index}.md`,
  } as PageIndexInfo;
}

describe('LocalProvider', () => {
  test('init() awaits FlexSearch addAsync before resolving', async () => {
    const pages = Array.from({ length: 4 }, (_, i) => createPage(i));

    const provider = new LocalProvider();
    provider.fetchSearchIndex = async () => pages;

    await provider.init({ mode: 'local', currentLang: 'en', currentVersion: '' });

    const state = (
      globalThis as unknown as { __flexSearchMockState: FlexSearchMockState }
    ).__flexSearchMockState;

    expect(state.pendingAdds.length).toBe(pages.length * 3);
    expect(state.pendingAdds.every(add => add.settled)).toBe(true);
  });
});
