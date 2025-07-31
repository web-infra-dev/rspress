/**
 * Inspired from fumadocs docsite
 * @from https://github.com/fuma-nama/fumadocs/blob/5723bbe58ef805a5421a780abf235a10b251be2f/apps/docs/app/docs/%5B...slug%5D/page.client.tsx#L11
 * @license MIT
 */
import { useLang } from '@rspress/core/runtime';
import { useCallback, useRef, useState } from 'react';
import {
  iconContainer,
  iconCopy,
  iconSuccess,
  llmsTxtCopyButtonContainer,
  success,
} from './LlmsCopyButton.module.scss';
import { useMdUrl } from './useMdUrl';

function IconCopy() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={iconCopy}
      fill="none"
    >
      <path
        d="M4.33301 4.14386V2.60416C4.33301 2.08639 4.75274 1.66666 5.27051 1.66666H13.3955C13.9133 1.66666 14.333 2.08639 14.333 2.60416V10.7292C14.333 11.2469 13.9133 11.6667 13.3955 11.6667H11.8384"
        stroke="#808080"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.7295 4.33334H2.60449C2.08673 4.33334 1.66699 4.75308 1.66699 5.27084V13.3958C1.66699 13.9136 2.08673 14.3333 2.60449 14.3333H10.7295C11.2473 14.3333 11.667 13.9136 11.667 13.3958V5.27084C11.667 4.75308 11.2473 4.33334 10.7295 4.33334Z"
        stroke="#808080"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSuccess() {
  return (
    <svg width="32" height="32" viewBox="0 0 30 30" className={iconSuccess}>
      <path
        fill="#49cd37"
        d="m13 24l-9-9l1.414-1.414L13 21.171L26.586 7.586L28 9L13 24z"
      />
    </svg>
  );
}

type LlmsTxtCopyButtonProps = {
  /**
   * Text by language, used with `useLang`.
   * @default en: 'Copy Markdown', zh: '复制 Markdown'
   */
  textByLang?: Record<string, string>;
  /**
   * Priority is higher than textByLang
   * @default ''
   */
  text?: string;
  onClick?: () => void;
};

const cache = new Map<string, string>();
function LlmsCopyButton(props: LlmsTxtCopyButtonProps) {
  const { onClick, text, textByLang } = props;
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
      } else {
        timer.current = window.setTimeout(() => {
          setFinished(false);
          timer.current = null;
        }, 500);
      }
    }
  }, [pathname]);

  if (!pathname) {
    return <></>;
  }

  return (
    <button
      disabled={isLoading}
      className={[llmsTxtCopyButtonContainer, isFinished ? success : '']
        .filter(Boolean)
        .join(' ')}
      onClick={onClick ?? handleClick}
    >
      <div className={iconContainer}>
        <IconSuccess />
        <IconCopy />
      </div>
      <span>{text ?? textByLang?.[lang] ?? 'Copy Markdown'}</span>
    </button>
  );
}

export { LlmsCopyButton };
