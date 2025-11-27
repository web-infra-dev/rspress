import { NoSSR, usePageData, withBase } from '@rspress/core/runtime';
import { useCallback, useState } from 'react';
// @ts-ignore
import { normalizeId } from '../../dist/utils';
import MobileOperation from './common/mobile-operation';
import './Device.scss';

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
    return withBase(url);
  };
  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  return haveDemos ? (
    <div className="rspress-fixed-device">
      <style>
        {`
            body {
              --rp-aside-width: 0px;
            }
            @media (min-width: 960px) {
              .rspress-doc-container {
                padding-right: calc(var(--rp-device-width) + var(--rp-preview-padding) * 2);
              }
            }
          `
          .split('\n')
          .join(' ')}
      </style>
      <NoSSR>
        <iframe
          // refresh when load the iframe, then remove NoSSR
          src={getPageUrl(url)}
          className="rspress-fixed-iframe"
          key={iframeKey}
        ></iframe>
      </NoSSR>
      <MobileOperation
        url={getPageUrl(url)}
        className="rspress-fixed-operation"
        refresh={refresh}
      />
    </div>
  ) : null;
};
