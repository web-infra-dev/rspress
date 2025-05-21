import { useCallback, useEffect, useState } from 'react';

const useForceRefresh = () => {
  const [_, setKey] = useState(0);

  const forceRefresh = useCallback(() => {
    return setKey(prevKey => prevKey + 1);
  }, [setKey]);

  return forceRefresh;
};

let iframeUrl: string | undefined;

const observer = new Map<string, () => void>();

const publishIframeUrl = (url: string) => {
  iframeUrl = url;
  for (const [, refresh] of observer) {
    refresh();
  }
};

const useIframeUrlPerComp = () => {
  const forceRefresh = useForceRefresh();

  useEffect(() => {
    const id = Math.random().toString(36).slice(5);
    observer.set(id, forceRefresh);

    return () => {
      observer.delete(id);
    };
  }, []);

  return iframeUrl;
};

export { useIframeUrlPerComp, publishIframeUrl };
