import { useDark, usePage } from '@rspress/core/runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
// @ts-expect-error
import { normalizeId } from '../../dist/utils';
import { getPageFullUrl, getPageUrl } from './common/getPageUrl';
import MobileOperation from './common/PreviewOperations';
import './FixedDevice.css';

export default () => {
  const { page } = usePage();
  const pageName = `${normalizeId(page.pagePath)}`;
  const demoId = `_${pageName}`;
  const { haveIframeFixedDemos } = page;

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
      <iframe
        src={getPageUrl(demoId)}
        className="rp-fixed-device__iframe"
        key={iframeKey}
        ref={iframeRef}
      />
      <MobileOperation
        url={getPageFullUrl(demoId)}
        className="rp-fixed-device__operations"
        refresh={refresh}
      />
    </div>
  ) : null;
};
