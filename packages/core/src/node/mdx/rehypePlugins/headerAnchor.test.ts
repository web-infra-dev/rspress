import { describe, it } from '@rstest/core';
import { compile } from '../processor';

describe('rehypeHeadAnchor', () => {
  it('basic', async () => {
    const result = await compile({
      source: `
# Guide

## title 1 {#custom-id}

## title 1 \{#custom-id}

## title 2

## title 2

## \`title\` 2

## Title 2

## **title** 2

{/* prettier-ignore-start */}
## *title* 2
{/* prettier-ignore-end */}

`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/index.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });

  it('should render inline code in title', async () => {
    const result = await compile({
      source: `
# Hello World \`inline code\`
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(result).toMatchSnapshot();
  });

  it('should support custom id', async () => {
    const result = await compile({
      source: `
# Hello World \`inline code\` \\{#custom-id}
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });

    // This is actually a wrong usage, but we need to be compatible.
    const resultWithoutBackslash = await compile({
      source: `
# Hello World \`inline code\` {#custom-id}
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(resultWithoutBackslash).toEqual(result);
    expect(result).toMatchSnapshot();
  });

  it('should support mdx component with trim', async () => {
    const result = await compile({
      source: `
# Hello World <Badge text={"WARNING"} />
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });

    // This is actually a wrong usage, but we need to be compatible.
    const resultWithoutBackslash = await compile({
      source: `
# Hello World <Badge text={"WARNING"} />
`,
      checkDeadLinks: false,
      docDirectory: '/usr/rspress-project/docs',
      filepath: '/usr/rspress-project/docs/inline-code.mdx',
      config: null,
      pluginDriver: null,
      routeService: null,
    });
    expect(resultWithoutBackslash).toEqual(result);
    expect(result).toMatchSnapshot();
  });
});
