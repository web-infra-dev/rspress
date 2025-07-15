import { useCallback, useEffect, useState } from 'react';
import { NoSSR, usePageData, useWindowSize, withBase } from 'rspress/runtime';
// @ts-ignore
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
  const [asideWidth, setAsideWidth] = useState('0px');
  const { width: innerWidth } = useWindowSize();
  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  // get default value from root
  // listen resize and re-render
  useEffect(() => {
    const root = document.querySelector(':root');
    if (root) {
      const defaultAsideWidth =
        getComputedStyle(root).getPropertyValue('--rp-aside-width');
      setAsideWidth(defaultAsideWidth);
    }
  }, []);

  useEffect(() => {
    const node = document.querySelector('.rspress-doc-container');
    const { style } = document.documentElement;
    if (haveDemos) {
      if (innerWidth > 1280) {
        node?.setAttribute(
          'style',
          'padding-right: calc(var(--rp-device-width) + var(--rp-preview-padding) * 2)',
        );
      } else if (innerWidth > 960) {
        node?.setAttribute(
          'style',
          `padding-right: calc(${
            innerWidth - 1280
          }px + var(--rp-device-width) + var(--rp-preview-padding) * 2)`,
        );
      } else {
        node?.removeAttribute('style');
      }
      style.setProperty('--rp-aside-width', '0px');
    } else {
      node?.removeAttribute('style');
      style.setProperty('--rp-aside-width', asideWidth);
    }
  }, [haveDemos, asideWidth, innerWidth]);

  return haveDemos ? (
    <div className="fixed-device">
      <NoSSR>
        <iframe
          // refresh when load the iframe, then remove NoSSR
          src={getPageUrl(url)}
          className="fixed-iframe"
          key={iframeKey}
        ></iframe>
      </NoSSR>
      <MobileOperation
        url={getPageUrl(url)}
        className="fixed-operation"
        refresh={refresh}
      />
    </div>
  ) : null;
};
