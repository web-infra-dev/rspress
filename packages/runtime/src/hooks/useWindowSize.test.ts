import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useWindowSize', () => {
  it('should have debounce implementation with RESIZE_DEBOUNCE_MS constant', () => {
    const filePath = path.join(__dirname, 'useWindowSize.ts');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Verify the constant is defined
    expect(fileContent).toContain('const RESIZE_DEBOUNCE_MS = 150');

    // Verify debounce is implemented with setTimeout
    expect(fileContent).toContain('setTimeout');
    expect(fileContent).toContain('RESIZE_DEBOUNCE_MS');
  });

  it('should clear timeout with conditional check', () => {
    const filePath = path.join(__dirname, 'useWindowSize.ts');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Verify conditional clearTimeout is used
    expect(fileContent).toContain('if (timeoutId) clearTimeout(timeoutId)');

    // Verify non-null assertion operator is NOT used
    expect(fileContent).not.toContain('clearTimeout(timeoutId!)');
  });

  it('should register and cleanup resize event listener', () => {
    const filePath = path.join(__dirname, 'useWindowSize.ts');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Verify resize listener is registered
    expect(fileContent).toContain("addEventListener('resize'");

    // Verify cleanup removes the listener
    expect(fileContent).toContain("removeEventListener('resize'");
  });

  it('should set initial size immediately', () => {
    const filePath = path.join(__dirname, 'useWindowSize.ts');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Verify initial size is set immediately (before addEventListener)
    const setStateMatch = fileContent.match(/setSize\(\{[^}]+\}\)/g);
    expect(setStateMatch).toBeTruthy();
    expect(setStateMatch?.length).toBeGreaterThanOrEqual(2); // One for initial, one in setTimeout
  });

  it('should export useWindowSize function', async () => {
    const module = await import('./useWindowSize');

    expect(module.useWindowSize).toBeDefined();
    expect(typeof module.useWindowSize).toBe('function');
  });
});
