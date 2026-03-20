import { App } from './App';
import { ClientRuntimeBridge } from './ClientRuntimeBridge';
import type { Page } from './initPageData';

export function ClientApp({
  initialPageData = null as unknown as Page,
}: {
  initialPageData?: Page;
}) {
  return (
    <ClientRuntimeBridge initialPageData={initialPageData}>
      <App />
    </ClientRuntimeBridge>
  );
}
