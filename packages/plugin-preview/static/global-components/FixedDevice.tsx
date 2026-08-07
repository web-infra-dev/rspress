import { useDark, useLang, usePage } from '@rspress/core/runtime';
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
  const lang = useLang();
  const demoUrl = getPageUrl(demoId);
  const demoFullUrl = getPageFullUrl(demoId);

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
    <>
      <a
        className="rp-fixed-device__mobile-link"
        href={demoUrl}
        target="_blank"
        rel="noreferrer"
      >
        {lang === 'zh' || lang.startsWith('zh-') ? '打开 Demo' : 'Open Demo'}
      </a>
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
          src={demoUrl}
          className="rp-fixed-device__iframe"
          key={iframeKey}
          ref={iframeRef}
        />
        <MobileOperation
          url={demoFullUrl}
          className="rp-fixed-device__operations"
          refresh={refresh}
        />
      </div>
    </>
  ) : null;
};
