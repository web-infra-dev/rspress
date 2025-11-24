import { NoSSR, useLang, usePageData, withBase } from '@rspress/core/runtime';
import { type MouseEvent, useCallback, useState } from 'react';
import MobileOperation from './common/Operations';
import IconCode from './icons/Code';
import './Preview.css';

type PreviewProps = {
  children: React.ReactNode[];
  previewMode: 'internal' | 'iframe-follow';
  demoId: string;
};

const Preview: React.FC<PreviewProps> = props => {
  const { children, previewMode, demoId } = props;
  const { page } = usePageData();
  const [showCode, setShowCode] = useState(false);
  const lang = useLang();
  const url = `/~demo/${demoId}`;

  const getPageUrl = () => {
    if (page?.devPort) {
      return `http://localhost:${page.devPort}/${demoId}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${withBase(url)}`;
    }
    // Do nothing in ssr
    return '';
  };
  const toggleCode = useCallback(
    (ev: MouseEvent<HTMLButtonElement>) => {
      if (!showCode) {
        ev.currentTarget.blur();
      }
      setShowCode(!showCode);
    },
    [showCode],
  );

  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  return (
    <NoSSR>
      <div className="rp-preview rp-not-doc">
        {previewMode === 'iframe-follow' ? (
          <div className="rp-preview-wrapper" style={{ display: 'flex' }}>
            <div className="rp-preview-code">{children?.[0]}</div>
            <div className="rp-preview-device">
              <iframe src={getPageUrl()} key={iframeKey}></iframe>
              <MobileOperation url={getPageUrl()} refresh={refresh} />
            </div>
          </div>
        ) : (
          <div>
            <div className="rp-preview-card">
              <div
                style={{
                  overflow: 'auto',
                  flex: 'auto',
                }}
              >
                {children?.[1]}
              </div>
              <div className="rp-preview-operations web">
                <button
                  onClick={toggleCode}
                  aria-label={lang === 'zh' ? '收起代码' : 'Collapse Code'}
                  className={showCode ? 'button-expanded' : ''}
                >
                  <IconCode />
                </button>
              </div>
            </div>
            <div
              className={`${
                showCode ? 'rp-preview-code-show' : 'rp-preview-code-hide'
              } rp-preview-`}
            >
              {children?.[0]}
            </div>
          </div>
        )}
      </div>
    </NoSSR>
  );
};

export default Preview;
