declare module '*.mdx' {
  import type { ComponentType } from 'react';

  const MDXComponent: ComponentType<{
    [key: string]: any;
  }>;

  export default MDXComponent;
}

declare module '*?raw' {
  const content: string;
  export default content;
}
