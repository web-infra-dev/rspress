import React, { Suspense, useSyncExternalStore } from 'react';
import { safeBrowserOnly, safeUse } from '@rspress/core/runtime';

export interface NoSSRProps {
  children: React.ReactNode;

  reason?: string | (() => unknown);

  fallback?: React.ReactNode;
}

function ModernNoSSR({ children, reason }: NoSSRProps) {
  safeUse!(safeBrowserOnly!(reason));

  return <>{children}</>;
}

function subscribe() {
  return () => {};
}

export function OldNoSSR({ children, fallback = null }: NoSSRProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!isMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function NoSSR(props: NoSSRProps) {
  const { fallback = null, ...rest } = props;

  if (typeof safeBrowserOnly === 'function') {
    return (
      <Suspense fallback={fallback}>
        <ModernNoSSR {...rest} />
      </Suspense>
    );
  }

  return <OldNoSSR fallback={fallback} {...rest} />;
}
