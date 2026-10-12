import { useWebMcp, type WebMcpOptions } from '@rspress/core/runtime';
import { startTransition, StrictMode, Suspense, useState } from 'react';

const pending = new Promise<never>(() => {});
const inputSchema = { type: 'object', properties: { add: { type: 'number' } } };

function ToolOwner({
  count,
  enabled,
  name,
  duplicate = false,
}: {
  count: number;
  enabled: boolean;
  name: string;
  duplicate?: boolean;
}) {
  const options: WebMcpOptions<
    { add?: number },
    { value: number; cancellable: boolean }
  > = {
    name,
    enabled,
    description: 'Read the counter',
    inputSchema: { ...inputSchema },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
      consequentialHint: false,
      debugging: true,
    },
    execute: (input, { signal }) => ({
      value: count + (input.add ?? 0),
      cancellable: Boolean(signal),
    }),
  };
  const { supported, registered, error } = useWebMcp(options);
  // A speculative render must never publish its callback to external callers.
  if (count === 99) throw pending;
  return (
    <output data-testid={duplicate ? 'duplicate-state' : 'hook-state'}>
      {JSON.stringify({
        supported,
        registered,
        error: error?.message ?? null,
        count,
      })}
    </output>
  );
}

export default function HookHarness() {
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(true);
  const [duplicate, setDuplicate] = useState(false);
  const [name, setName] = useState('rspress_test_value');
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>Increment tool count</button>
      <button onClick={() => startTransition(() => setCount(99))}>
        Suspend tool render
      </button>
      <button onClick={() => setCount(2)}>Recover tool render</button>
      <button onClick={() => setEnabled(!enabled)}>Toggle tool enabled</button>
      <button onClick={() => setMounted(!mounted)}>Toggle tool mounted</button>
      <button onClick={() => setDuplicate(!duplicate)}>
        Toggle duplicate tool
      </button>
      <button onClick={() => setName('rspress_test_renamed')}>
        Rename tool
      </button>
      <StrictMode>
        <Suspense fallback={<span>Waiting for tool render</span>}>
          {mounted && <ToolOwner count={count} enabled={enabled} name={name} />}
        </Suspense>
        {duplicate && <ToolOwner count={0} enabled name={name} duplicate />}
      </StrictMode>
    </div>
  );
}
