import { BrowserOnly } from '@rspress/core/runtime';
import { useState } from 'react';

export function BrowserOnlyDemo() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button id="browser-only-increment" onClick={() => setCount(count + 1)}>
        Increment BrowserOnly
      </button>
      <BrowserOnly fallback={<span>Sync fallback</span>}>
        {() => (
          <span id="browser-only-sync-content">
            Sync {count} {window.location.pathname}
          </span>
        )}
      </BrowserOnly>
      <BrowserOnly fallback={<span>Async fallback</span>}>
        {async () => {
          await Promise.resolve();
          return <span id="browser-only-async-content">Async {count}</span>;
        }}
      </BrowserOnly>
    </div>
  );
}
