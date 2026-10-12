import { lazy, Suspense } from 'react';

const WebMcpRuntime = lazy(() => import('./webMcp/WebMcpRuntime'));

export function WebMcp() {
  if (
    typeof document === 'undefined' ||
    !(document as Document & { modelContext?: unknown }).modelContext
  ) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <WebMcpRuntime />
    </Suspense>
  );
}
