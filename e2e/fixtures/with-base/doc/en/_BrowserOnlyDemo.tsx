import { BrowserOnly } from '@rspress/core/runtime';
import { useState } from 'react';

export function BrowserOnlySyncDemo() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button
        id="browser-only-sync-increment"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <BrowserOnly
        fallback={<span id="browser-only-sync-fallback">Sync fallback</span>}
      >
        {() => <span id="browser-only-sync-content">Sync {count}</span>}
      </BrowserOnly>
    </div>
  );
}

export function BrowserOnlyAsyncDemo() {
  const [value, setValue] = useState('initial');

  return (
    <div>
      <button
        id="browser-only-async-update"
        onClick={() => setValue('updated')}
      >
        Update
      </button>
      <BrowserOnly
        fallback={
          <span id="browser-only-async-fallback">Async fallback {value}</span>
        }
      >
        {async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return <span id="browser-only-async-content">Async {value}</span>;
        }}
      </BrowserOnly>
    </div>
  );
}
