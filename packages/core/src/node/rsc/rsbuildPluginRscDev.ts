import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RsbuildPlugin } from '@rsbuild/core';
import {
  cleanUrl,
  type RouteMeta,
  removeTrailingSlash,
  type UserConfig,
} from '@rspress/shared';
import { createHead } from '@unhead/react/server';
import type { SSRRender } from '../../runtime/ssrRender';
import type { RouteService } from '../route/RouteService';

type SSRBundleExports = {
  default?: {
    render?: SSRRender;
  };
  render?: SSRRender;
};

function normalizeRoutePath(routePath: string) {
  return cleanUrl(decodeURIComponent(routePath))
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .toLowerCase();
}

function getRequestRoutePath(pathname: string, base: string) {
  const normalizedBase = removeTrailingSlash(base) || '/';

  if (normalizedBase !== '/' && !pathname.startsWith(normalizedBase)) {
    return null;
  }

  const relativePath =
    normalizedBase === '/'
      ? pathname
      : pathname.slice(normalizedBase.length) || '/';

  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
}

function isHtmlRequest(req: IncomingMessage) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const accept = req.headers.accept ?? '';
  if (!accept.includes('text/html') && !accept.includes('*/*')) {
    return false;
  }

  const pathname = new URL(req.url ?? '/', 'http://rspress.local').pathname;
  return !/\.[a-z0-9]+$/i.test(pathname) || pathname.endsWith('.html');
}

function resolveRouteMeta(
  routeService: RouteService,
  routePath: string,
): RouteMeta {
  const normalizedRoutePath = normalizeRoutePath(routePath);
  const matchedRoute =
    routeService
      .getRoutes()
      .find(
        route => normalizeRoutePath(route.routePath) === normalizedRoutePath,
      ) ?? null;

  if (matchedRoute) {
    return matchedRoute;
  }

  return {
    routePath,
    absolutePath: '',
    relativePath: '',
    pageName: '404',
    lang: '',
    version: '',
  };
}

async function loadRender(server: {
  environments: {
    node: {
      loadBundle: (entryName: string) => Promise<SSRBundleExports>;
    };
  };
}) {
  const bundle = await server.environments.node.loadBundle('index');
  return bundle.render ?? bundle.default?.render;
}

async function handleRscRequest(
  req: IncomingMessage,
  res: ServerResponse,
  server: {
    environments: {
      node: {
        loadBundle: (entryName: string) => Promise<SSRBundleExports>;
      };
      web: {
        getTransformedHtml: (entryName: string) => Promise<string>;
      };
    };
  },
  routeService: RouteService,
  config: UserConfig,
) {
  if (!isHtmlRequest(req)) {
    return false;
  }

  const pathname = new URL(req.url ?? '/', 'http://rspress.local').pathname;
  const routePath = getRequestRoutePath(pathname, config.base ?? '/');

  if (!routePath) {
    return false;
  }

  const render = await loadRender(server);
  if (!render) {
    return false;
  }

  const htmlTemplate =
    await server.environments.web.getTransformedHtml('index');
  const head = createHead();
  const route = resolveRouteMeta(routeService, routePath);
  const { appHtml } = await render(routePath, head, config.head, {
    htmlTemplate,
    route,
  });

  res.statusCode = routeService.isExistRoute(routePath) ? 200 : 404;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (req.method === 'HEAD') {
    res.end();
  } else {
    res.end(appHtml);
  }

  return true;
}

export const rsbuildPluginRscDev = ({
  routeService,
  config,
}: {
  routeService: RouteService;
  config: UserConfig;
}): RsbuildPlugin => ({
  name: 'rspress-inner-rsbuild-plugin-rsc-dev',
  setup(api) {
    api.onBeforeStartDevServer(({ server }) => {
      server.middlewares.use((req, res, next) => {
        handleRscRequest(
          req,
          res,
          server as Parameters<typeof handleRscRequest>[2],
          routeService,
          config,
        )
          .then(handled => {
            if (!handled) {
              next();
            }
          })
          .catch(next);
      });
    });
  },
});
