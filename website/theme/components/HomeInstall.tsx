import { useLang } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconCopy,
  IconSuccess,
  SvgWrapper,
} from '@rspress/core/theme-original';
import { useEffect, useRef, useState } from 'react';
import { quickStartPrompts } from '../prompts/quickStart';
import styles from './HomeInstall.module.scss';

const command = 'npm create rspress@latest';

export function HomeInstall() {
  const lang = useLang();
  const isZh = lang === 'zh';
  const [copied, setCopied] = useState<'command' | 'agent' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labels = {
    command: isZh ? '复制初始化命令' : 'Copy create command',
    agent: isZh ? '复制 Agent 初始化指引' : 'Copy setup prompt for your agent',
    copied: isZh ? '已复制' : 'Copied!',
    failed: isZh ? '复制失败，请重试。' : 'Copy failed. Please try again.',
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy(target: 'command' | 'agent') {
    const text =
      target === 'command' ? command : quickStartPrompts[isZh ? 'zh' : 'en'];
    if (!(await copyToClipboard(text))) {
      setAnnouncement(labels.failed);
      return;
    }

    setCopied(target);
    setAnnouncement(`${labels[target]}: ${labels.copied}`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.command}
        aria-label={labels.command}
        title={copied === 'command' ? labels.copied : labels.command}
        onClick={() => void handleCopy('command')}
      >
        <span className={styles.dollar} aria-hidden="true">
          $
        </span>
        <code>{command}</code>
        <span className={styles.commandIcon} aria-hidden="true">
          <SvgWrapper icon={copied === 'command' ? IconSuccess : IconCopy} />
        </span>
      </button>
      <button
        type="button"
        className={styles.agent}
        aria-label={labels.agent}
        title={labels.agent}
        onClick={() => void handleCopy('agent')}
      >
        <span className={styles.agentIcon} aria-hidden="true">
          {copied === 'agent' ? (
            <SvgWrapper icon={IconSuccess} />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="m11 3 1.55 4.45L17 9l-4.45 1.55L11 15l-1.55-4.45L5 9l4.45-1.55L11 3Z" />
              <path d="m18 14 .75 2.25L21 17l-2.25.75L18 20l-.75-2.25L15 17l2.25-.75L18 14Z" />
            </svg>
          )}
        </span>
        <span className={styles.agentLabel}>
          {copied === 'agent' ? labels.copied : 'for Agent'}
        </span>
      </button>
      <span className={styles.announcement} role="status">
        {announcement}
      </span>
    </div>
  );
}
