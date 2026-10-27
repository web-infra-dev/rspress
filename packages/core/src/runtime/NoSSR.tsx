import React, { Suspense, useSyncExternalStore } from 'react';
import { safeBrowserOnly } from './reactDom';
import { safeUse } from './react';

export interface NoSSRProps {
  children: React.ReactNode;

  reason?: string | (() => unknown);

  fallback?: React.ReactNode;
}

function ModernNoSSR({ children, reason }: NoSSRProps) {
  safeUse!(safeBrowserOnly!(reason));

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

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function NoSSR(props: NoSSRProps) {
  const { fallback = null, ...rest } = props;

  if (import.meta.env.SSG_MD) {
    return <>{fallback}</>;
  }

  if (typeof safeBrowserOnly === 'function') {
    return (
      <Suspense fallback={fallback}>
        <ModernNoSSR {...rest} />
      </Suspense>
    );
  }

  return <LegacyNoSSR fallback={fallback} {...rest} />;
}
