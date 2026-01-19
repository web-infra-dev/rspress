/**
 * Inspired from fumadocs docsite
 * @from https://github.com/fuma-nama/fumadocs/blob/5723bbe58ef805a5421a780abf235a10b251be2f/apps/docs/app/docs/%5B...slug%5D/page.client.tsx#L11
 * @license MIT
 */
import { useLang } from '@rspress/core/runtime';
import { IconCopy, IconSuccess } from '@theme';
import { useCallback, useRef, useState } from 'react';
import commonStyles from './index.module.scss';
import styles from './LlmsCopyButton.module.scss';
import { useMdUrl } from './useMdUrl';

export interface LlmsCopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Text by language, used with `useLang`.
   * @default en: 'Copy Markdown', zh: '\u590d\u5236 Markdown'
   */
  textByLang?: Record<string, string>;
  /**
   * Priority is higher than textByLang
   * @default ''
   */
  text?: string;
  /**
   * Overrides the default click handler.
   * If provided, the default copy to clipboard functionality will not be executed.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const cache = new Map<string, string>();

export function LlmsCopyButton(props: LlmsCopyButtonProps) {
  const {
    onClick,
    text,
    textByLang = { zh: '复制 Markdown', en: 'Copy Markdown' },
    ...otherProps
  } = props;
  const lang = useLang();

  const { pathname } = useMdUrl();

  const [isLoading, setLoading] = useState(false);
  const [isFinished, setFinished] = useState(false);

  const timer = useRef<number | null>(null);
  const handleClick = useCallback(async () => {
    setLoading(true);

    const url = pathname;
    try {
      const content: string =
        cache.get(url) ?? (await fetch(url).then(res => res.text()));

      cache.set(url, content);
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
      }, 500);
    }
  }, [pathname]);

  if (!pathname) {
    return <></>;
  }

  return (
    <button
      {...otherProps}
      disabled={isLoading}
      className={[
        'rp-not-doc',
        commonStyles.button,
        styles.llmsCopyButtonContainer,
        isLoading ? styles.loading : '',
        isFinished ? styles.success : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick ?? handleClick}
    >
      <div className={styles.iconContainer}>
        <IconSuccess className={styles.iconSuccess} />
        <IconCopy className={styles.iconCopy} />
      </div>
      <span>{text ?? textByLang?.[lang] ?? 'Copy Markdown'}</span>
    </button>
  );
}
