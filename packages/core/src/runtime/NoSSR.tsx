import { type ReactNode, Suspense, useSyncExternalStore } from 'react';
import { safeBrowserOnly } from './reactDom';
import { safeUse } from './react';

export interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function ModernNoSSR({ children }: NoSSRProps) {
  safeUse!(safeBrowserOnly!('This content is only rendered in the browser.'));

  return <>{children}</>;
}

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function LegacyNoSSR({ children, fallback = null }: NoSSRProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return <>{isMounted ? children : fallback}</>;
}

export function NoSSR(props: NoSSRProps) {
  const { fallback = null } = props;

  if (import.meta.env.SSG_MD) {
    return <>{fallback}</>;
  }

  if (typeof safeBrowserOnly === 'function') {
    return (
      <Suspense fallback={fallback}>
        <ModernNoSSR {...props} />
      </Suspense>
    );
  }

  return <LegacyNoSSR {...props} />;
}
