import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { applyThemeToDOM } from './useThemeState';

rs.mock('@rspress/core/runtime', () => ({}));

// The repository's unit tests run in a plain node environment, so the few DOM
// APIs applyThemeToDOM touches are stubbed here instead of pulling in jsdom.
let rafCallback: FrameRequestCallback | undefined;
const runNextFrame = () => {
  const callback = rafCallback;
  rafCallback = undefined;
  callback?.(0);
};

beforeEach(() => {
  rafCallback = undefined;
  const classes = new Set<string>();
  const root = {
    classList: {
      add: (name: string) => classes.add(name),
      remove: (name: string) => classes.delete(name),
      toggle: (name: string, force: boolean) =>
        force ? classes.add(name) : classes.delete(name),
      contains: (name: string) => classes.has(name),
    },
    style: {} as { colorScheme?: string },
  };
  globalThis.document = { documentElement: root } as unknown as Document;
  globalThis.window = {
    getComputedStyle: () => ({}) as CSSStyleDeclaration,
  } as unknown as Window & typeof globalThis;
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    rafCallback = callback;
    return 1;
  };
});

afterEach(() => {
  // @ts-expect-error cleaning up the node-environment stubs
  delete globalThis.document;
  // @ts-expect-error cleaning up the node-environment stubs
  delete globalThis.window;
  // @ts-expect-error cleaning up the node-environment stubs
  delete globalThis.requestAnimationFrame;
});

describe('applyThemeToDOM', () => {
  it('toggles the theme classes and color scheme', () => {
    const root = document.documentElement;

    applyThemeToDOM('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.classList.contains('rp-dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');

    applyThemeToDOM('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.classList.contains('rp-dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  it('suppresses transitions until the frame after the theme flips', () => {
    const root = document.documentElement;

    applyThemeToDOM('dark');
    expect(root.classList.contains('rp-theme-switching')).toBe(true);

    runNextFrame();
    expect(root.classList.contains('rp-theme-switching')).toBe(false);
  });

  it('skips the suppression when the DOM already matches the theme', () => {
    const root = document.documentElement;
    root.classList.add('dark');

    applyThemeToDOM('dark');
    expect(root.classList.contains('rp-theme-switching')).toBe(false);
    expect(rafCallback).toBeUndefined();
    // The classes and color scheme are still applied.
    expect(root.classList.contains('rp-dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
  });
});
