import { useI18n } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconCopy,
  IconSuccess,
  SvgWrapper,
} from '@rspress/core/theme';
import { useCallback, useRef, useState } from 'react';
import { getLlmsCopyContent } from './getLlmsCopyContent';
import { useMdUrl } from './useMdUrl';

export function LlmsCopyRow() {
  const t = useI18n();
  const { pathname } = useMdUrl();
  const [isLoading, setLoading] = useState(false);
  const [isFinished, setFinished] = useState(false);
  const timer = useRef<number | null>(null);

  const handleClick = useCallback(async () => {
    if (!pathname) return;
    setLoading(true);
    try {
      const content = await getLlmsCopyContent(pathname);
      const isCopied = await copyToClipboard(content);
      if (!isCopied) {
        return;
      }

      setFinished(true);
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      timer.current = window.setTimeout(() => {
        setFinished(false);
        timer.current = null;
      }, 1500);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  if (!pathname) {
    return null;
  }

  return (
    <button
      className="rp-outline__action-row"
      onClick={handleClick}
      disabled={isLoading}
    >
      <SvgWrapper icon={isFinished ? IconSuccess : IconCopy} />
      <span>{t('copyMarkdownText')}</span>
    </button>
  );
}
