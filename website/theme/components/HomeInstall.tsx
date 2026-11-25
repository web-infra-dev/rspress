import { useLang } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconCopy,
  IconSuccess,
  SvgWrapper,
} from '@rspress/core/theme-original';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { quickStartPrompts } from '../prompts/quickStart';
import styles from './HomeInstall.module.scss';

const command = 'npm create rspress@latest';

export function HomeInstall() {
  const lang = useLang();
  const isZh = lang === 'zh';
  const [copied, setCopied] = useState<'command' | 'agent' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [ripple, setRipple] = useState<{
    id: number;
    target: 'command' | 'agent';
    x: number;
    y: number;
  } | null>(null);
  const rippleId = useRef(0);
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

  async function handleCopy(
    target: 'command' | 'agent',
    event: MouseEvent<HTMLButtonElement>,
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setRipple({
      id: ++rippleId.current,
      target,
      x: event.detail === 0 ? bounds.width / 2 : event.clientX - bounds.left,
      y: event.detail === 0 ? bounds.height / 2 : event.clientY - bounds.top,
    });

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

  function renderRipple(target: 'command' | 'agent') {
    if (ripple?.target !== target) return null;
    return (
      <span
        key={ripple.id}
        className={styles.ripple}
        style={{ left: ripple.x, top: ripple.y }}
        aria-hidden="true"
        onAnimationEnd={() =>
          setRipple(current => (current?.id === ripple.id ? null : current))
        }
      />
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.command}
          data-copied={copied === 'command' || undefined}
          aria-label={labels.command}
          title={copied === 'command' ? labels.copied : labels.command}
          onClick={event => void handleCopy('command', event)}
        >
          {renderRipple('command')}
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
          data-copied={copied === 'agent' || undefined}
          aria-label={labels.agent}
          title={labels.agent}
          onClick={event => void handleCopy('agent', event)}
        >
          {renderRipple('agent')}
          <span className={styles.icon} aria-hidden="true">
            <span className={styles.agentIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="m10 3 1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8L10 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  className={styles.sparkle}
                  d="m19 14 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className={styles.successIcon}>
              <SvgWrapper icon={IconSuccess} />
            </span>
          </span>
          <span className={styles.agentLabel}>
            <span key={copied === 'agent' ? 'copied' : 'agent'}>
              {copied === 'agent' ? labels.copied : 'for Agent'}
            </span>
          </span>
        </button>
      </div>
      <span className={styles.announcement} role="status">
        {announcement}
      </span>
    </div>
  );
}
