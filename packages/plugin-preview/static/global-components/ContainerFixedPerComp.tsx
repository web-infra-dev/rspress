import { NoSSR, useLang, usePageData, withBase } from '@rspress/core/runtime';
import { type MouseEvent, useCallback, useState } from 'react';
import IconCode from './icons/Code';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  demoId: string;
};

const MobileContainerFixedPerComp: React.FC<ContainerProps> = props => {
  const { children, demoId } = props;
  const { page } = usePageData();
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

  const setIframeUrl = () => {
    const fixedIframe = document.querySelector('.rspress-fixed-iframe');
    fixedIframe?.setAttribute('src', getPageUrl());
  };

  return <div onClick={setIframeUrl}>{children}</div>;
};

const ContainerFixedPerComp = (props: ContainerProps) => {
  const { children, isMobile } = props;
  const [showCode, setShowCode] = useState(false);
  const lang = useLang();

  const toggleCode = useCallback(
    (ev: MouseEvent<HTMLButtonElement>) => {
      if (!showCode) {
        ev.currentTarget.blur();
      }
      setShowCode(!showCode);
    },
    [showCode],
  );

  return (
    <>
      {isMobile === 'true' ? (
        <MobileContainerFixedPerComp {...props} />
      ) : (
        <NoSSR>
          <div className="rspress-preview">
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
          </div>
        </NoSSR>
      )}
    </>
  );
};

export default ContainerFixedPerComp;
