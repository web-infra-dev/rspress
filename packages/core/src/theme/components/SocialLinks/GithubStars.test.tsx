import { afterEach, describe, expect, it } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { GithubStars } from './GithubStars';

const originalLocalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
);

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
  } else {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

function mockLocalStorage(cache: Record<string, string>) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => cache[key] ?? null,
      setItem: () => {},
    },
  });
}

describe('GithubStars', () => {
  it('does not render cached stars during the first render', () => {
    mockLocalStorage({
      'rp-github-stars:web-infra-dev/rspress': JSON.stringify({
        count: 12345,
        fetchedAt: Date.now(),
      }),
    });

    const markup = renderToStaticMarkup(
      <GithubStars
        content="https://github.com/web-infra-dev/rspress"
        icon={<span data-icon="github" />}
      />,
    );

    expect(markup).not.toContain('rp-social-links__github-stars-count');
    expect(markup).not.toContain('12.3K');
    expect(markup).toContain('aria-label="GitHub repository"');
  });
});
