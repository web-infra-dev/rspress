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

const CODE_MIN_WIDTH = 200;
const DEVICE_MIN_WIDTH = 240;
const KEY_STEP = 16;

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

  const containerRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  // null = default flex layout (no drag yet)
  const [deviceWidth, setDeviceWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  // measured values for aria-*
  const [bounds, setBounds] = useState({ now: 0, max: 0 });

  const getMax = useCallback(() => {
    const container = containerRef.current;
    if (!container) return DEVICE_MIN_WIDTH;
    const handle = resizerRef.current?.getBoundingClientRect().width ?? 0;
    // clientWidth excludes container border
    return Math.max(
      DEVICE_MIN_WIDTH,
      container.clientWidth - CODE_MIN_WIDTH - handle,
    );
  }, []);

  const clamp = useCallback(
    (w: number) => Math.min(Math.max(w, DEVICE_MIN_WIDTH), getMax()),
    [getMax],
  );

  const getCurrentWidth = () =>
    deviceRef.current?.getBoundingClientRect().width ?? DEVICE_MIN_WIDTH;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const max = getMax();
      setBounds({ now: Math.round(getCurrentWidth()), max: Math.round(max) });
      // keep custom width valid when container shrinks
      setDeviceWidth(w =>
        w == null ? w : Math.min(Math.max(w, DEVICE_MIN_WIDTH), max),
      );
    };
    const ro = new ResizeObserver(update);
    ro.observe(container);
    if (deviceRef.current) ro.observe(deviceRef.current);
    return () => ro.disconnect();
  }, [getMax]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startWidth: getCurrentWidth() };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setDeviceWidth(clamp(drag.startWidth - (e.clientX - drag.startX)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = deviceWidth ?? getCurrentWidth();
    let next: number | null = null;
    // handle on left of device: moving left grows device
    if (e.key === 'ArrowLeft') next = current + KEY_STEP;
    else if (e.key === 'ArrowRight') next = current - KEY_STEP;
    else if (e.key === 'Home') next = DEVICE_MIN_WIDTH;
    else if (e.key === 'End') next = getMax();
    if (next == null) return;
    e.preventDefault();
    setDeviceWidth(clamp(next));
  };

  return (
    <div
      ref={containerRef}
      className={`rp-preview rp-not-doc rp-preview--iframe-follow${
        dragging ? ' rp-preview--iframe-follow--dragging' : ''
      }`}
    >
      <div className="rp-preview--iframe-follow__code">{children?.[0]}</div>
      <div
        ref={resizerRef}
        className="rp-preview--iframe-follow__resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize preview"
        aria-valuenow={bounds.now}
        aria-valuemin={DEVICE_MIN_WIDTH}
        aria-valuemax={bounds.max}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setDeviceWidth(null)}
        onKeyDown={onKeyDown}
      >
        <span className="rp-preview--iframe-follow__resizer__dot" />
        <span className="rp-preview--iframe-follow__resizer__dot" />
        <span className="rp-preview--iframe-follow__resizer__dot" />
      </div>
      <div
        ref={deviceRef}
        className="rp-preview--iframe-follow__device"
        style={
          deviceWidth == null ? undefined : { flex: `0 0 ${deviceWidth}px` }
        }
      >
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
      setShowCode(prevShowCode => !prevShowCode);
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
