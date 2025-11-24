import { NoSSR, usePageData, withBase } from '@rspress/core/runtime';
import { useCallback, useState } from 'react';
// @ts-expect-error
import { normalizeId } from '../../dist/utils';
import MobileOperation from './common/mobile-operation';
import './Device.css';

export default () => {
  const { page } = usePageData();
  const pageName = `${normalizeId(page.pagePath)}`;
  const demoId = `_${pageName}`;
  const url = `~demo/${demoId}`;
  const { haveDemos } = page;

  const getPageUrl = (url: string) => {
    if (page?.devPort) {
      return `http://localhost:${page.devPort}/${demoId}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${withBase(url)}`;
    }
    // Do nothing in ssr
    return '';
  };
  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  return haveDemos ? (
    <div className="rp-fixed-device">
      {/* hide the outline */}
      <style>{`.rp-doc-layout__outline { display: none;}`}</style>
      <NoSSR>
        <iframe
          // refresh when load the iframe, then remove NoSSR
          src={getPageUrl(url)}
          className="rp-fixed-iframe"
          key={iframeKey}
        ></iframe>
      </NoSSR>
      <MobileOperation
        url={getPageUrl(url)}
        className="rp-fixed-operation"
        refresh={refresh}
      />
    </div>
  ) : null;
};
