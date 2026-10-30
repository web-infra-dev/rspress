import { describe, expect, it } from '@rstest/core';
import type { Code } from 'mdast';
import { getNodeMeta, parseImports } from './utils';

describe('parseImports', () => {
  it('collects static imports in source order, including duplicates', () => {
    expect(
      parseImports(
        `import React from 'react';
import { useState as state } from 'react';
import * as ReactDOM from 'react-dom';
import './style.css';`,
        'js',
      ),
    ).toEqual(['react', 'react', 'react-dom', './style.css']);
  });

  it.each([
    'js',
    '.js',
    'mjs',
    '.mjs',
    'cjs',
    '.cjs',
    'jsx',
    '.jsx',
    'tsx',
    '.tsx',
  ])('parses JSX with the %s extension', sourceExt => {
    expect(
      parseImports(
        `import React from 'react';
export default () => <div>你好 👋</div>;
import after from 'after';`,
        sourceExt,
      ),
    ).toEqual(['react', 'after']);
  });

  it.each(['ts', '.ts', 'tsx', '.tsx', 'mts', '.mts', 'cts', '.cts'])(
    'preserves type-only imports with the %s extension',
    sourceExt => {
      expect(
        parseImports(
          `import type { ReactNode } from 'react';
import { type Props, Button } from 'ui';
const props: Props = {};`,
          sourceExt,
        ),
      ).toEqual(['react', 'ui']);
    },
  );

  it('parses type assertions in TypeScript without treating them as JSX', () => {
    expect(
      parseImports(
        `const value = <string>input;
import after from 'after';`,
        '.ts',
      ),
    ).toEqual(['after']);
  });

  it('parses TypeScript annotations and JSX together', () => {
    expect(
      parseImports(
        `import type { ReactNode } from 'react';
export default function Demo({ text }: { text: string }): ReactNode {
  return <div>{text}</div>;
}`,
        '.tsx',
      ),
    ).toEqual(['react']);
  });

  it('ignores dynamic imports, re-exports, require calls and import-like text', () => {
    expect(
      parseImports(
        `// import ignored from 'comment';
const text = "import ignored from 'string'";
export { value } from 're-export';
export * from 'export-all';
const lazy = import('dynamic');
const commonjs = require('commonjs');
import 'static';`,
        'js',
      ),
    ).toEqual(['static']);
  });

  it('decodes escaped import sources', () => {
    expect(
      parseImports(String.raw`import 're\u0061ct'; import './你好.js';`, 'js'),
    ).toEqual(['react', './你好.js']);
  });

  it('returns no imports for empty input or a demo without imports', () => {
    expect(parseImports('', 'tsx')).toEqual([]);
    expect(parseImports('export default () => <div />;', 'tsx')).toEqual([]);
  });
});

const code = (meta?: string): Code => ({
  type: 'code',
  meta,
  lang: 'tsx',
  value: '',
});

describe('getNodeMeta', () => {
  it('strips quotes from quoted meta values', () => {
    // regression: /'"`/ is a literal three-character sequence instead of
    // a character class, so quoted values kept their quotes and
    // direction="vertical" produced an invalid rp-playground-"vertical"
    // class name and never matched the horizontal check.
    expect(getNodeMeta(code('direction="vertical"'), 'direction')).toBe(
      'vertical',
    );
    expect(getNodeMeta(code("direction='vertical'"), 'direction')).toBe(
      'vertical',
    );
    expect(getNodeMeta(code('direction=`vertical`'), 'direction')).toBe(
      'vertical',
    );
  });

  it('returns unquoted values as-is', () => {
    expect(getNodeMeta(code('direction=vertical'), 'direction')).toBe(
      'vertical',
    );
  });

  it('does not match meta names by bare prefix', () => {
    // regression: startsWith(metaName) matched direction2=... for
    // direction and returned the whole raw item.
    expect(
      getNodeMeta(code('direction2=vertical'), 'direction'),
    ).toBeUndefined();
  });

  it('returns bare meta names unchanged', () => {
    expect(getNodeMeta(code('vertical'), 'direction')).toBeUndefined();
    expect(getNodeMeta(code('direction'), 'direction')).toBe('direction');
  });
});
