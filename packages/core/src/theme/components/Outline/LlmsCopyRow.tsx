import { useI18n } from '@rspress/core/runtime';
import { IconCopy, IconSuccess } from '@theme';
import { useCallback, useRef, useState } from 'react';
import { useMdUrl } from '../Llms/useMdUrl';
import { SvgWrapper } from '../SvgWrapper';

const cache = new Map<string, string>();

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
      const content: string =
        cache.get(pathname) ?? (await fetch(pathname).then(res => res.text()));
      cache.set(pathname, content);
      await navigator.clipboard.writeText(content);
    } finally {
      setLoading(false);
      setFinished(true);
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      timer.current = window.setTimeout(() => {
        setFinished(false);
        timer.current = null;
      }, 1500);
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
