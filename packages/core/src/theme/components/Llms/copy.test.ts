import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';

var fallbackCopy: ReturnType<typeof rs.fn>;

rs.mock('copy-to-clipboard', () => ({
  default: (fallbackCopy = rs.fn()),
}));

import { copyToClipboard } from './copy';

describe('copyToClipboard', () => {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'navigator',
  );

  beforeEach(() => {
    fallbackCopy.mockClear();
  });

  afterEach(() => {
    if (navigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', navigatorDescriptor);
      return;
    }

    delete (globalThis as typeof globalThis & { navigator?: Navigator })
      .navigator;
  });

  it('should prefer navigator.clipboard.writeText when available', async () => {
    const writeText = rs.fn(async () => undefined);

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          writeText,
        },
      },
    });

    await copyToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(fallbackCopy).not.toHaveBeenCalled();
  });

  it('should fall back to copy-to-clipboard when writeText rejects', async () => {
    const writeText = rs.fn(async () => {
      throw new Error('clipboard unavailable');
    });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          writeText,
        },
      },
    });

    await copyToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(fallbackCopy).toHaveBeenCalledWith('hello');
  });

  it('should fall back to copy-to-clipboard when navigator.clipboard is missing', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });

    await copyToClipboard('hello');

    expect(fallbackCopy).toHaveBeenCalledWith('hello');
  });
});
