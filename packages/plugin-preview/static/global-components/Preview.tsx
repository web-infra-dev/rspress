import { useDark } from '@rspress/core/runtime';
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getPageFullUrl, getPageUrl } from './common/getPageUrl';
import MobileOperation from './common/PreviewOperations';
import IconCode from './icons/Code';
import './Preview.css';

type PreviewProps = {
  children: React.ReactNode[];
  previewMode: 'internal' | 'iframe-follow';
  demoId: string;
};

interface BasePreviewProps {
  children: React.ReactNode[];
  demoId: string;
}

const PreviewIframeFollow: React.FC<BasePreviewProps> = ({
  children,
  demoId,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const refresh = useCallback(() => {
    setIframeKey(Math.random());
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dark = useDark();
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: 'theme-change',
        dark,
      },
      '*',
    );
  }, [dark]);

  return (
    <div className="rp-preview rp-not-doc rp-preview--iframe-follow">
      <div className="rp-preview--iframe-follow__code">{children?.[0]}</div>
      <div className="rp-preview--iframe-follow__device">
        <iframe
          className="rp-preview--iframe-follow__device__iframe"
          src={getPageUrl(demoId)}
          key={iframeKey}
          ref={iframeRef}
        />
        <MobileOperation url={getPageFullUrl(demoId)} refresh={refresh} />
      </div>
    </div>
  );
};

const PreviewInternal: React.FC<{ children: React.ReactNode[] }> = ({
  children,
}) => {
  const [showCode, setShowCode] = useState(false);

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
    <div
      className={`rp-preview rp-not-doc rp-preview--internal ${showCode ? 'rp-preview--internal--show-code' : ''}`}
    >
      <div className="rp-preview--internal__card">
        <div className="rp-preview--internal__card__content">
          {children?.[1]}
        </div>
        <div className="rp-preview-operations rp-preview-operations--web">
          <button
            onClick={toggleCode}
            aria-label="Collapse Code"
            className={`rp-preview-operations__button ${showCode ? 'rp-preview-operations__button--expanded' : ''}`}
          >
            <IconCode />
          </button>
        </div>
      </div>
      <div
        className={`rp-preview--internal__code-wrapper ${
          showCode ? 'rp-preview--internal__code-wrapper--visible' : ''
        }`}
      >
        <div className="rp-preview--internal__code">{children?.[0]}</div>
      </div>
    </div>
  );
};

const Preview: React.FC<PreviewProps> = props => {
  const { children, previewMode, demoId } = props;

  return (
    <>
      {previewMode === 'iframe-follow' ? (
        <PreviewIframeFollow demoId={demoId}>{children}</PreviewIframeFollow>
      ) : (
        <PreviewInternal>{children}</PreviewInternal>
      )}
    </>
  );
};

export default Preview;
