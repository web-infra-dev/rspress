import type { ReactNode } from 'react';

export interface RootProps {
  /**
   * The children elements to render inside the Root component.
   */
  children: ReactNode;
}

/**
 * A wrapper component for the entire application.
 *
 * The Root component wraps all content in the application, including the Layout
 * and global UI components. By default, it simply renders its children without
 * any additional markup or styling.
 *
 * You can eject and customize this component to add global wrappers, providers,
 * or any other elements that should wrap your entire application.
 *
 * @param {RootProps} props - The properties for the Root component.
 * @returns {JSX.Element} The children elements wrapped by the Root component.
 *
 * @example
 * Default usage (no customization needed):
 * ```tsx
 * import { Root } from '@theme';
 *
 * function App() {
 *   return (
 *     <Root>
 *       <YourContent />
 *     </Root>
 *   );
 * }
 * ```
 *
 * @example
 * Ejected and customized:
 * ```tsx
 * // In your ejected theme/components/Root/index.tsx
 * import type { ReactNode } from 'react';
 *
 * export interface RootProps {
 *   children: ReactNode;
 * }
 *
 * export function Root({ children }: RootProps) {
 *   return (
 *     <div className="my-custom-root">
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */
export function Root({ children }: RootProps) {
  return <>{children}</>;
}
