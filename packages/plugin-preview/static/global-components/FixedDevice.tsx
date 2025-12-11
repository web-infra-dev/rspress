import { NoSSR, useDark, usePage, withBase } from '@rspress/core/runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    return withBase(url);
  };
  const [iframeKey, setIframeKey] = useState(0);
  const dark = useDark();
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'theme-change',
        dark,
      },
      '*',
    );
  }, [dark]);

  return haveIframeFixedDemos ? (
    <div className="rp-fixed-device">
      {/* hide the outline */}
      <style>{`@media (min-width: 1280px) {
      .rp-doc-layout__outline { 
        display: none; 
      }
    }
    @media (min-width: 960px) and (max-width: 1280px) {
      .rp-doc-layout__doc-container {
        padding-right: calc(var(--rp-device-width) + var(--rp-preview-padding));
      }
    }
    `}</style>
      <NoSSR>
        <iframe
          src={getPageUrl(url)}
          className="rp-fixed-device__iframe"
          key={iframeKey}
          ref={iframeRef}
        />
      </NoSSR>
      <MobileOperation
        url={getPageUrl(url)}
        className="rp-fixed-device__operations"
        refresh={refresh}
      />
    </div>
  ) : null;
};
