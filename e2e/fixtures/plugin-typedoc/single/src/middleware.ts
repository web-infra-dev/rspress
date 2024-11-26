import type { IncomingMessage, ServerResponse } from 'node:http';

export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => void;

export function createMiddleware(): Middleware {
  return [] as any;
}

/**
 * 将多个中间件，合并成一个中间件执行
 * @param middlewares 中间件列表
 * @returns
 */
export function mergeMiddlewares(middlewares: Middleware[]): Middleware {
  return middlewares[0];
}
