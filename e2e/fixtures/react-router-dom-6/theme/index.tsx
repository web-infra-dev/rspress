import { type ReactNode, Suspense, useEffect, useState } from 'react';

export * from '@rspress/core/theme-original';

export function Root({ children }: { children: ReactNode }) {
  // This boundary exercises client navigation after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return children;
  return (
    <Suspense fallback={<p>Loading suspended page</p>}>{children}</Suspense>
  );
}
