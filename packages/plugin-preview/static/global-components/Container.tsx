import { useCallback, useState } from 'react';
import { withBase, useLang, NoSSR } from '@rspress/core/runtime';
import { getParameters } from 'codesandbox/lib/api/define';
import MobileOperation from './common/mobile-operation';
import IconCode from './icons/Code';
import IconCodesandbox from './icons/Codesandbox';
import './Container.scss';

type ContainerProps = {
  children: React.ReactNode[];
  isMobile: 'true' | 'false';
  enableCodesandbox: 'true' | 'false';
  url: string;
  content: string;
  packageName: string;
};

const Container: React.FC<ContainerProps> = props => {
  const { children, isMobile, url, content, packageName, enableCodesandbox } =
    props;
  const [showCode, setShowCode] = useState(false);
  const lang = useLang();

  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${withBase(url)}`;
    }
    // Do nothing in ssr
    return '';
  };
  const toggleCode = (e: any) => {
    if (!showCode) {
      e.target.blur();
    }
    setShowCode(!showCode);
  };

  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  const gotoCodeSandBox = () => {
    const sandBoxConfig = {
      files: {
        'package.json': {
          isBinary: false,
          content: JSON.stringify({
            dependencies: {
              react: '18',
              'react-dom': '18',
              [packageName]: 'latest',
            },
          }),
        },
        [`demo.tsx`]: {
          isBinary: false,
          content,
        },
        [`index.tsx`]: {
          isBinary: false,
          content: [
            `import React from 'react'`,
            `import ReactDOM from 'react-dom'`,
            `import Demo from './demo'`,
            `ReactDOM.render(<Demo />, document.getElementById('root'))`,
          ].join('\n'),
        },
      },
    };

    // to specific demo file
    const query = `file=/demo.tsx`;
    const form = document.createElement('form');
    form.action = `https://codesandbox.io/api/v1/sandboxes/define?query=${encodeURIComponent(
      query,
    )}`;
    form.target = '_blank';
    form.method = 'POST';
    form.style.display = 'none';
    const field = document.createElement('input');
    field.name = 'parameters';
    field.type = 'hidden';
    field.setAttribute('value', getParameters(sandBoxConfig));
    form.appendChild(field);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <NoSSR>
      <div className="rspress-preview">
        {isMobile === 'true' ? (
          <div className="rspress-preview-wrapper flex">
            <div className="rspress-preview-code">{children?.[0]}</div>
            <div className="rspress-preview-device">
              <iframe src={getPageUrl()} key={iframeKey}></iframe>
              <MobileOperation
                url={url}
                refresh={refresh}
                gotoCodeSandBox={
                  enableCodesandbox === 'true' ? gotoCodeSandBox : undefined
                }
              />
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
                {enableCodesandbox === 'true' && (
                  <button
                    onClick={gotoCodeSandBox}
                    aria-label={
                      lang === 'zh'
                        ? '在 Codesandbox 打开'
                        : 'Open in Codesandbox'
                    }
                  >
                    <IconCodesandbox />
                  </button>
                )}
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
