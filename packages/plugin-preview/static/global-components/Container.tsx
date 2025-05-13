import { NoSSR, useLang, usePageData, withBase } from '@rspress/core/runtime';
import { type MouseEvent, useCallback, useState } from 'react';
import MobileOperation from './common/mobile-operation';
import IconCode from './icons/Code';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  demoId: string;
};

const Container: React.FC<ContainerProps> = props => {
  const { children, isMobile, demoId } = props;
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
      <div className="rspress-preview">
        {isMobile === 'true' ? (
          <div className="rspress-preview-wrapper">
            <div className="rspress-preview-code">{children?.[0]}</div>
            <div className="rspress-preview-device">
              <iframe src={getPageUrl()} key={iframeKey}></iframe>
              <MobileOperation url={getPageUrl()} refresh={refresh} />
            </div>
          </div>
        ) : (
          <div>
            <div className="rspress-preview-card">
              <div
                style={{
                  overflow: 'auto',
                  flex: 'auto',
                }}
              >
                {children?.[1]}
              </div>
              <div className="rspress-preview-operations web">
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
                showCode
                  ? 'rspress-preview-code-show'
                  : 'rspress-preview-code-hide'
              }`}
            >
              {children?.[0]}
            </div>
          </div>
        )}
      </div>
    </NoSSR>
  );
};

export default Container;
