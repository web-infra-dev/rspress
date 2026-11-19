declare module '*?theme-preview' {
  export const Layout: import('react').ComponentType<
    import('@rspress/core/theme-original').LayoutProps
  >;
  export const Outline: typeof import('@rspress/core/theme-original').Outline;
}
