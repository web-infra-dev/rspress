import { withBase } from '@rspress/core/runtime';

const DEV_PORT = process.env.RSPRESS_IFRAME_DEV_PORT;

/*
 * We must provide the complete address for scanning QR Code.
 */
export const getPageFullUrl = (demoId: string) => {
  if (DEV_PORT && import.meta.env.DEV) {
    return `http://${window.location.hostname}:${DEV_PORT}/${demoId}`;
  }
  const url = `/~demo/${demoId}`;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${withBase(url)}`;
  }
  // do nothing in ssr
  return '';
};

export const getPageUrl = (demoId: string) => {
  if (DEV_PORT && import.meta.env.DEV) {
    return `http://${window.location.hostname}:${DEV_PORT}/${demoId}`;
  }
  const url = `/~demo/${demoId}`;
  return withBase(url);
};
