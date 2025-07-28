declare module '*.mdx' {
  import type { ComponentType } from 'react';

  const MDXComponent: ComponentType<{
    [key: string]: any;
  }>;

  export default MDXComponent;
}