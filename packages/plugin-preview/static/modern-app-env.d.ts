/// <reference types='@modern-js/module-tools/types' />

declare module 'virtual-meta' {
  const demos: Record<
    string,
    {
      id: string;
      path: string;
    }[]
  >;
  export { demos };
}
