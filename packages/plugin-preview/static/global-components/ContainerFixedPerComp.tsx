import { NoSSR, useLang, usePageData, withBase } from '@rspress/core/runtime';
import { Tab, Tabs } from '@theme';
import { type MouseEvent, useCallback, useState } from 'react';
import IconCode from './icons/Code';
import { publishIframeUrl } from './useIframeUrlPerComp';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  demoId: string;
  entryFile?: string;
  otherFiles?: string[];
};

const getTabs = (entryFile?: string, otherFiles?: string[], children?: any) => {
  if (entryFile && otherFiles && otherFiles.length > 0) {
    return (
      <Tabs>
        <Tab label={entryFile}>{children?.[0]}</Tab>
        {children.slice(2).map((child: any, i: number) => {
          const filename = otherFiles ? otherFiles[i] : `File ${i + 1}`;
          return (
            <Tab key={filename} label={filename}>
              {child || null}
            </Tab>
          );
        })}
      </Tabs>
    );
  }
  return null;
};

const MobileContainerFixedPerComp: React.FC<ContainerProps & {}> = props => {
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
    const url = getPageUrl();
    publishIframeUrl(url);
  };

  return (
    <div className="rspress-preview-code" onClick={setIframeUrl}>
      {getTabs(props.entryFile, props.otherFiles, children) || children}
    </div>
  );
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
          <div className="rspress-preview rp-not-doc">
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
                {getTabs(props.entryFile, props.otherFiles, children) ||
                  children?.[0]}
              </div>
            </div>
          </div>
        </NoSSR>
      )}
    </>
  );
};

export default ContainerFixedPerComp;
