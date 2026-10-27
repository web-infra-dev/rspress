import { BrowserOnly } from '@rspress/core/runtime';
import {
  Component,
  lazy,
  type ReactNode,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

export function BrowserOnlySyncDemo() {
  const [count, setCount] = useState(0);
  const [mount, setMount] = useState(false);
  const [mountedContent, setMountedContent] = useState('');

  useLayoutEffect(() => {
    if (mount) {
      setMountedContent(
        document.getElementById('browser-only-mounted-content')?.textContent ??
          'Missing content',
      );
    }
  }, [mount]);

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
        {() => (
          <span
            id="browser-only-sync-content"
            data-path={window.location.pathname}
          >
            Sync {count}
          </span>
        )}
      </BrowserOnly>
      <button id="browser-only-mount" onClick={() => setMount(true)}>
        Mount BrowserOnly
      </button>
      {mount && (
        <BrowserOnly fallback={<span>Mount fallback</span>}>
          {() => (
            <span id="browser-only-mounted-content">Mounted immediately</span>
          )}
        </BrowserOnly>
      )}
      <output id="browser-only-mount-observation">{mountedContent}</output>
    </div>
  );
}

export function BrowserOnlyAsyncDemo() {
  const [value, setValue] = useState('initial');
  const pending = useRef(new Map<string, () => void>());

  return (
    <div>
      <button
        id="browser-only-async-update"
        onClick={() => setValue('updated')}
      >
        Update
      </button>
      <button
        id="browser-only-async-resolve"
        onClick={() => pending.current.get(value)?.()}
      >
        Resolve
      </button>
      <BrowserOnly
        fallback={
          <span id="browser-only-async-fallback">Async fallback {value}</span>
        }
      >
        {async () => {
          await new Promise<void>(resolve => {
            pending.current.set(value, resolve);
          });
          return <span id="browser-only-async-content">Async {value}</span>;
        }}
      </BrowserOnly>
    </div>
  );
}

const LazyBrowserContent = lazy(
  () =>
    new Promise<{ default: () => ReactNode }>(resolve => {
      window.addEventListener(
        'browser-only-resolve-lazy',
        () => {
          resolve({
            default: () => <span id="browser-only-lazy-content">Loaded</span>,
          });
        },
        { once: true },
      );
    }),
);

export function BrowserOnlySuspenseDemo() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button id="browser-only-load-lazy" onClick={() => setShow(true)}>
        Load lazy content
      </button>
      <Suspense
        fallback={<span id="browser-only-parent-fallback">Parent</span>}
      >
        <span id="browser-only-sibling">Visible sibling</span>
        <BrowserOnly
          fallback={<span id="browser-only-lazy-fallback">Lazy fallback</span>}
        >
          {() => (show ? <LazyBrowserContent /> : null)}
        </BrowserOnly>
      </Suspense>
    </div>
  );
}

class BrowserOnlyErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    return this.state.error ? (
      <span id="browser-only-error">{this.state.error.message}</span>
    ) : (
      this.props.children
    );
  }
}

export function BrowserOnlyAsyncRaceDemo() {
  const [request, setRequest] = useState('first');
  const pending = useRef(
    new Map<
      string,
      { resolve: (content: ReactNode) => void; reject: (error: Error) => void }
    >(),
  );

  return (
    <div>
      <button
        id="browser-only-next-request"
        onClick={() => setRequest('second')}
      >
        Start second request
      </button>
      <button
        id="browser-only-resolve-first"
        onClick={() =>
          pending.current
            .get('first')
            ?.resolve(<span id="browser-only-race-content">First result</span>)
        }
      >
        Resolve first
      </button>
      <button
        id="browser-only-reject-first"
        onClick={() => pending.current.get('first')?.reject(new Error('Stale'))}
      >
        Reject first
      </button>
      <button
        id="browser-only-resolve-second"
        onClick={() =>
          pending.current
            .get('second')
            ?.resolve(<span id="browser-only-race-content">Second result</span>)
        }
      >
        Resolve second
      </button>
      <button
        id="browser-only-reject-second"
        onClick={() =>
          pending.current
            .get('second')
            ?.reject(new Error('Current request failed'))
        }
      >
        Reject second
      </button>
      <BrowserOnlyErrorBoundary>
        <BrowserOnly
          fallback={
            <span id="browser-only-race-fallback">Pending {request}</span>
          }
        >
          {() =>
            new Promise<ReactNode>((resolve, reject) => {
              pending.current.set(request, { resolve, reject });
            })
          }
        </BrowserOnly>
      </BrowserOnlyErrorBoundary>
    </div>
  );
}
