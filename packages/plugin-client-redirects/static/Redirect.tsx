import { useLocation } from '@rspress/runtime';
import { isExternalUrl } from '@rspress/shared';
import { useEffect, useMemo } from 'react';

// these are types copied from src/types.ts
type RedirectRule = {
  to: string;
  from: string | string[];
};

type RedirectsOptions = {
  redirects?: RedirectRule[];
};

export default function Redirect(props: RedirectsOptions = {}) {
  const { pathname, hash } = useLocation();
  const { redirects } = props;

  // 使用useMemo预处理重定向规则，避免每次渲染都重新创建RegExp对象
  const processedRedirects = useMemo(() => {
    if (!redirects?.length) return [];

    return redirects.map(({ from, to }) => ({
      to,
      patterns: Array.isArray(from) ? from : [from],
    }));
  }, [redirects]);

  useEffect(() => {
    // 如果没有重定向规则或者不在浏览器环境，则直接返回
    if (!processedRedirects.length || typeof window === 'undefined') {
      return;
    }

    // 尝试查找匹配的重定向规则
    for (const { patterns, to } of processedRedirects) {
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern);

          if (regex.test(pathname)) {
            // 找到匹配规则，执行重定向
            if (isExternalUrl(to)) {
              window.location.replace(to);
            } else {
              window.location.replace(pathname.replace(regex, to) + hash);
            }
            return;
          }
        } catch (error) {
          // 处理无效的正则表达式
          console.warn(`Invalid redirect pattern: ${pattern}`, error);
        }
      }
    }
  }, [pathname, hash, processedRedirects]);

  return null;
}
