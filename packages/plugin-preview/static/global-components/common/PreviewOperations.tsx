import { useLang } from '@rspress/core/runtime';
import { QRCodeSVG } from 'qrcode.react';
import {
  type MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import IconLaunch from '../icons/Launch';
import IconQrcode from '../icons/Qrcode';
import IconRefresh from '../icons/Refresh';
import './PreviewOperations.css';

const locales = {
  zh: {
    refresh: '刷新页面',
    open: '在新页面打开',
  },
  en: {
    refresh: 'Refresh',
    open: 'Open in new page',
  },
};

export default (props: {
  url: string;
  className?: string;
  refresh: () => void;
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const { url, className = '', refresh } = props;
  const lang = useLang();
  const triggerRef = useRef(null);
  const t = lang === 'zh' ? locales.zh : locales.en;

  const toggleQRCode: MouseEventHandler<HTMLButtonElement> = e => {
    if (!showQRCode) {
      e.currentTarget.blur();
    }
    setShowQRCode(!showQRCode);
  };
  const openNewPage = () => {
    window.open(url);
  };

  const contains = function (root: HTMLElement | null, ele: Node | null) {
    if (!root) {
      return false;
    }
    if (root.contains) {
      return root.contains(ele);
    }
    let node = ele;
    while (node) {
      if (node === root) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  const onClickOutside = useCallback(
    (ev: MouseEvent) => {
      if (!contains(triggerRef.current, ev.target as Node)) {
        setShowQRCode(false);
      }
    },
    [triggerRef],
  );

  useEffect(() => {
    if (showQRCode) {
      document.addEventListener('mousedown', onClickOutside, false);
    } else {
      document.removeEventListener('mousedown', onClickOutside, false);
    }
  }, [showQRCode]);

  return (
    <div
      className={`rp-preview-operations rp-preview-operations--mobile ${className}`}
    >
      <button
        className="rp-preview-operations__button"
        onClick={refresh}
        aria-label={t.refresh}
      >
        <IconRefresh />
      </button>
      <div className="rp-preview-operations__qrcode" ref={triggerRef}>
        {showQRCode && (
          <div className="rp-preview-operations__qrcode-popup">
            <QRCodeSVG value={url} size={96} />
          </div>
        )}
        <button
          className="rp-preview-operations__button"
          onClick={toggleQRCode}
        >
          <IconQrcode />
        </button>
      </div>
      <button
        className="rp-preview-operations__button"
        onClick={openNewPage}
        aria-label={t.open}
      >
        <IconLaunch />
      </button>
    </div>
  );
};
