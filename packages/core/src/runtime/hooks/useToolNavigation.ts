import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigation } from 'react-router-dom';
import type { NavigationResult } from '../webMcp/types';

// Native navigation prepares the page. A layout effect acknowledges that React
// has committed the corresponding page context before returning it to an agent.
export function useToolNavigation(result: NavigationResult) {
  const location = useLocation();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const snapshot = useRef({ result, location, state: navigation.state });
  const pending = useRef<
    | {
        target: string;
        startKey: string;
        done: boolean;
        resolve: (result: NavigationResult) => void;
        reject: (error: Error) => void;
        cleanup: () => void;
      }
    | undefined
  >(undefined);

  const settle = useCallback(() => {
    const request = pending.current;
    const current = snapshot.current;
    if (
      !request?.done ||
      current.state !== 'idle' ||
      current.location.key === request.startKey
    )
      return;
    pending.current = undefined;
    request.cleanup();
    if (current.result.routePath === request.target) {
      request.resolve(current.result);
    } else {
      request.reject(new Error('Navigation was superseded by another route.'));
    }
  }, []);

  useLayoutEffect(() => {
    snapshot.current = { result, location, state: navigation.state };
    settle();
  });

  useLayoutEffect(
    () => () => {
      pending.current?.cleanup();
      pending.current?.reject(
        new Error('Navigation failed or the page runtime was unmounted.'),
      );
      pending.current = undefined;
    },
    [],
  );

  return useCallback(
    (target: string, signal?: AbortSignal): Promise<NavigationResult> => {
      signal?.throwIfAborted();
      pending.current?.cleanup();
      pending.current?.reject(
        new Error('Navigation was superseded by another tool call.'),
      );
      pending.current = undefined;
      if (
        snapshot.current.result.routePath === target &&
        snapshot.current.state === 'idle'
      ) {
        return Promise.resolve(snapshot.current.result);
      }
      return new Promise((resolve, reject) => {
        const cancel = () => {
          if (pending.current === request) pending.current = undefined;
          request.cleanup();
          reject(
            signal?.reason ??
              new DOMException('Navigation cancelled.', 'AbortError'),
          );
        };
        const request = {
          target,
          startKey: snapshot.current.location.key,
          done: false,
          resolve,
          reject,
          cleanup: () => signal?.removeEventListener('abort', cancel),
        };
        pending.current = request;
        signal?.addEventListener('abort', cancel, { once: true });
        void Promise.resolve()
          .then(() => {
            if (pending.current === request) return navigate(target);
          })
          .then(() => {
            if (pending.current !== request) return;
            request.done = true;
            settle();
          })
          .catch(error => {
            if (pending.current === request) pending.current = undefined;
            request.cleanup();
            reject(error);
          });
      });
    },
    [navigate, settle],
  );
}
