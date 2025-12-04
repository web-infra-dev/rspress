/// <reference types='@rslib/core/types' />

declare module 'virtual-meta' {
  const demos: Record<string, []>;
  export { demos };
}

declare module '@theme' {
  const Tabs: React.FC<{ children: React.ReactNode }>;
  const Tab: React.FC<{ children: React.ReactNode; label: string }>;
  export { Tabs, Tab };
}