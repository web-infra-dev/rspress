import { NoSSR, usePage, withBase } from '@rspress/core/runtime';
import { useCallback, useState } from 'react';
// @ts-expect-error
import { normalizeId } from '../../dist/utils';
import MobileOperation from './common/PreviewOperations';
import './FixedDevice.css';

export default () => {
  const { page } = usePage();
  const pageName = `${normalizeId(page.pagePath)}`;
  const demoId = `_${pageName}`;
  const url = `~demo/${demoId}`;
  const { haveIframeFixedDemos } = page;

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

  return haveIframeFixedDemos ? (
    <div className="rp-fixed-device">
      {/* hide the outline */}
      <style>{`@media (min-width: 1280px) {.rp-doc-layout__outline { display: none; }}`}</style>
      <NoSSR>
        <iframe
          // refresh when load the iframe, then remove NoSSR
          src={getPageUrl(url)}
          className="rp-fixed-device__iframe"
          key={iframeKey}
        ></iframe>
      </NoSSR>
      <MobileOperation
        url={getPageUrl(url)}
        className="rp-fixed-device__operations"
        refresh={refresh}
      />
    </div>
  ) : null;
};
