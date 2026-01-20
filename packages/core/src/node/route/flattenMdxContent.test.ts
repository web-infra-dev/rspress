import { join } from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { flattenMdxContent } from './flattenMdxContent';

const fixtureDir = join(__dirname, './fixtures/flatten-mdx');

describe('flattenMdxContent', () => {
  it('should return content unchanged when no imports exist', async () => {
    const content = `# No Import

This is a simple mdx file without any imports.

## Section 1

Some content here.
`;
    const basePath = join(fixtureDir, 'no-import.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toBe(content);
    expect(result.deps).toEqual([]);
  });

  it('should flatten simple mdx import', async () => {
    const content = `# Simple Import

import ChildComponent from './child.mdx';

Some content before the component.

<ChildComponent />

Some content after the component.
`;
    const basePath = join(fixtureDir, 'simple-import.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toContain(
      'Some content before the component',
    );
    expect(result.flattenContent).toContain('## Child Component');
    expect(result.flattenContent).toContain(
      'This is the child component content',
    );
    expect(result.flattenContent).toContain('Some content after the component');
    expect(result.flattenContent).not.toContain('import ChildComponent');
    expect(result.flattenContent).not.toContain('<ChildComponent />');
    expect(result.deps).toContain(join(fixtureDir, 'child.mdx'));
  });

  it('should flatten multiple mdx imports', async () => {
    const content = `# Multiple Imports

import First from './first.mdx';
import Second from './second.md';

Some content.

<First />

Middle content.

<Second />

End content.
`;
    const basePath = join(fixtureDir, 'multiple-imports.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toContain('## First Component');
    expect(result.flattenContent).toContain('Content from first');
    expect(result.flattenContent).toContain('## Second Component');
    expect(result.flattenContent).toContain('Content from second');
    expect(result.flattenContent).not.toContain('import First');
    expect(result.flattenContent).not.toContain('import Second');
    expect(result.deps).toContain(join(fixtureDir, 'first.mdx'));
    expect(result.deps).toContain(join(fixtureDir, 'second.md'));
  });

  it('should handle paths with special characters (dots)', async () => {
    const content = `# Special Path

import Comp from './sub.dir/comp.mdx';

<Comp />
`;
    const basePath = join(fixtureDir, 'special-path.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toContain('## Component in sub.dir');
    expect(result.flattenContent).toContain('Content with special path');
    expect(result.flattenContent).not.toContain('import Comp');
    expect(result.deps).toContain(join(fixtureDir, 'sub.dir', 'comp.mdx'));
  });

  it('should ignore non-mdx imports', async () => {
    const content = `# Non MDX Import

import Button from './Button';
import { useState } from 'react';

This file imports JS/TS components that should be ignored.

<Button />
`;
    const basePath = join(fixtureDir, 'non-mdx-import.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    // Non-mdx imports should remain in the content
    expect(result.flattenContent).toContain('import Button');
    expect(result.flattenContent).toContain('<Button />');
    expect(result.deps).toEqual([]);
  });

  it('should replace multiple usages of the same component', async () => {
    const content = `# Multiple Usage

import Comp from './child.mdx';

First usage:

<Comp />

Second usage:

<Comp />

Third usage:

<Comp />
`;
    const basePath = join(fixtureDir, 'multiple-usage.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    // Count occurrences of child content
    const matches = result.flattenContent.match(/## Child Component/g);
    expect(matches).toHaveLength(3);
    expect(result.flattenContent).not.toContain('<Comp />');
    expect(result.deps).toContain(join(fixtureDir, 'child.mdx'));
  });

  it('should handle recursive imports', async () => {
    const recursiveDir = join(__dirname, './fixtures/recursive');
    const content = `# Recursive comp test

import Comp from './Comp.mdx';

<Comp />
`;
    const basePath = join(recursiveDir, 'index.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toContain('## h2 Comp');
    expect(result.flattenContent).toContain('Comp content');
    expect(result.flattenContent).toContain('## H2 comp in comp');
    expect(result.flattenContent).toContain('Comp in Comp content');
    expect(result.deps).toContain(join(recursiveDir, 'Comp.mdx'));
    expect(result.deps).toContain(join(recursiveDir, 'Comp-in-comp.mdx'));
  });

  it('should handle content with no import but with import-like text', async () => {
    const content = `# Import Discussion

This is a discussion about import statements.

The import keyword is used in JavaScript.
`;
    const basePath = join(fixtureDir, 'no-import.mdx');
    const result = await flattenMdxContent(content, basePath, {});

    expect(result.flattenContent).toBe(content);
    expect(result.deps).toEqual([]);
  });
});
