import {
  pathnameToRouteService,
  removeBase,
  routePathToMdPath,
  useLocation,
  usePage,
} from '@rspress/core/runtime';
import { useFullTextSearch, useLinkNavigate } from '@rspress/core/theme';
import { useCallback, useEffect, useRef } from 'react';
import type { WebMcpRuntimeOptions } from '../options';
import {
  createCurrentPageTool,
  createNavigateTool,
  createSearchTool,
  type SearchGroup,
} from './builtins';
import { isWebMcpSupported } from './register';
import { useWebMcpTool } from './useWebMcpTool';

const NAVIGATION_TIMEOUT_MS = 10_000;

interface PendingNavigation {
  cancel(error: Error): void;
  target: string;
  resolve(): void;
}

function resolveRoutePath(pathname: string): string | undefined {
  return pathnameToRouteService(removeBase(pathname))?.path;
}

function useAwaitedNavigate() {
  const navigate = useLinkNavigate();
  const { page } = usePage();
  const { search, hash } = useLocation();
  const currentTarget = `${page.routePath}${search}${hash}`;
  const currentTargetRef = useRef(currentTarget);
  const pendingRef = useRef<PendingNavigation | null>(null);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    currentTargetRef.current = currentTarget;
    const pending = pendingRef.current;
    if (pending?.target === currentTarget) {
      pendingRef.current = null;
      pending.resolve();
    }
  }, [currentTarget]);

  useEffect(
    () => () => {
      const error = new Error('Navigation was interrupted');
      pendingRef.current?.cancel(error);
      pendingRef.current = null;
    },
    [],
  );

  const navigateAndWait = useCallback(
    async (target: string) => {
      if (currentTargetRef.current === target) {
        await navigate(target);
        return;
      }

      let pending!: PendingNavigation;
      const controller = new AbortController();
      const completion = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          const error = new Error(
            `Navigation did not complete within ${NAVIGATION_TIMEOUT_MS}ms`,
          );
          pending.cancel(error);
        }, NAVIGATION_TIMEOUT_MS);
        pending = {
          cancel(error) {
            clearTimeout(timeout);
            controller.abort(error);
            reject(error);
          },
          target,
          resolve() {
            clearTimeout(timeout);
            resolve();
          },
        };
        pendingRef.current = pending;
      });

      try {
        await Promise.all([
          navigate(target, { signal: controller.signal }),
          completion,
        ]);
      } catch (error) {
        pending.cancel(
          error instanceof Error
            ? error
            : new Error('Navigation failed', { cause: error }),
        );
        if (pendingRef.current === pending) {
          pendingRef.current = null;
        }
        throw error;
      }
    },
    [navigate],
  );

  return useCallback(
    (target: string) => {
      const queued = queueRef.current
        .catch(() => undefined)
        .then(() => navigateAndWait(target));
      queueRef.current = queued;
      return queued;
    },
    [navigateAndWait],
  );
}

function CurrentPageTool() {
  const { page } = usePage();
  const tool = createCurrentPageTool(page, routePathToMdPath(page.routePath));
  useWebMcpTool(tool, undefined, [page.routePath]);
  return null;
}

function RegisteredSearchTool({
  search,
}: {
  search: (query: string, limit?: number) => Promise<SearchGroup[]>;
}) {
  useWebMcpTool(createSearchTool(search));
  return null;
}

function SearchTool() {
  const { initialized, search } = useFullTextSearch();
  return initialized && search ? (
    <RegisteredSearchTool search={search} />
  ) : null;
}

function NavigateTool() {
  const navigate = useAwaitedNavigate();
  const origin =
    typeof window === 'undefined' ? 'http://localhost' : location.origin;
  const tool = createNavigateTool(resolveRoutePath, origin, navigate);
  useWebMcpTool(tool, undefined, [origin, navigate]);
  return null;
}

function SupportedWebMcpRuntime({
  tools,
  currentPageEnabled,
  searchEnabled,
}: WebMcpRuntimeOptions) {
  const { page } = usePage();
  return (
    <>
      {currentPageEnabled ? <CurrentPageTool /> : null}
      {searchEnabled ? (
        <SearchTool key={`${page.lang}\0${page.version}`} />
      ) : null}
      {tools.navigate ? <NavigateTool /> : null}
    </>
  );
}

export default function WebMcpRuntime(options: WebMcpRuntimeOptions) {
  return isWebMcpSupported() ? <SupportedWebMcpRuntime {...options} /> : null;
}
