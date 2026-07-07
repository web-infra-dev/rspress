import { getCopyableText } from './getCopyableText';
import { describe, it, expect, beforeEach } from 'vitest';

describe('getCopyableText', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('should copy code blocks inside list items without list markers', () => {
    container.innerHTML = `
      <ol>
        <li>
          <p>Run this command:</p>
          <pre><code>npm install package-name</code></pre>
        </li>
      </ol>
    `;
    
    const codeBlock = container.querySelector('code') as HTMLElement;
    const result = getCopyableText(codeBlock);
    
    // Should NOT include the list marker "1. "
    expect(result).not.toMatch(/^\d+\.\s/);
    expect(result).toContain('npm install package-name');
  });

  it('should copy code blocks with unordered list markers suppressed', () => {
    container.innerHTML = `
      <ul>
        <li>
          Command: <pre><code>docker run image</code></pre>
        </li>
      </ul>
    `;
    
    const codeBlock = container.querySelector('code') as HTMLElement;
    const result = getCopyableText(codeBlock);
    
    expect(result).not.toContain('- ');
    expect(result).toContain('docker run image');
  });

  it('should preserve list markers for regular list content (non-code)', () => {
    container.innerHTML = `
      <ol>
        <li>First step</li>
        <li>Second step</li>
      </ol>
    `;
    
    const result = getCopyableText(container);
    
    expect(result).toContain('1. First step');
    expect(result).toContain('2. Second step');
  });

  it('should handle nested code inside list items', () => {
    container.innerHTML = `
      <ol>
        <li>
          <p>Step with multiple commands:</p>
          <pre><code>command1 arg1
command2 arg2</code></pre>
        </li>
      </ol>
    `;
    
    const preBlock = container.querySelector('pre') as HTMLElement;
    const result = getCopyableText(preBlock);
    
    expect(result).not.toMatch(/^\d+\./);
    expect(result).toContain('command1 arg1');
    expect(result).toContain('command2 arg2');
  });
});
