import {
  copyToClipboard,
  getCopyableText,
  IconArrowDown,
  IconCopy,
  IconSuccess,
  renderInlineMarkdown,
  SvgWrapper,
} from '@rspress/core/theme';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AGENT_ICONS } from './icons';
import './index.scss';

const ROTATE_INTERVAL = 4000;
const FADE_DURATION = 400;

function RotatingIcon({ index, fading }: { index: number; fading: boolean }) {
  return (
    <span
      className={clsx('rp-prompt__icon', fading && 'rp-prompt__icon--fade-out')}
      title={AGENT_ICONS[index].name}
    >
      {AGENT_ICONS[index].svg}
    </span>
  );
}

function getPromptText(element: HTMLElement | null) {
  if (!element) {
    return '';
  }

  return getCopyableText(element).trim();
}

export interface PromptProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Inline description rendered in the prompt header.
   */
  description?: string;
  /**
   * Header label for the prompt block.
   * @default 'Agent Prompt'
   */
  title?: string;
  /**
   * Eyebrow label shown above the title.
   * @default 'For your agent'
   */
  eyebrow?: string;
  /**
   * Controls the initial folded state.
   * @default true
   */
  defaultCollapsed?: boolean;
  /**
   * Override text copied to the clipboard.
   */
  copyText?: string;
  children: React.ReactNode;
}

export function Prompt({
  children,
  className,
  copyText,
  defaultCollapsed = true,
  description,
  eyebrow = 'For your agent',
  title = 'Agent Prompt',
  ...props
}: PromptProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIconIndex(prev => (prev + 1) % AGENT_ICONS.length);
        setFading(false);
      }, FADE_DURATION);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    const text = copyText ?? getPromptText(contentRef.current);
    if (!text) {
      return;
    }

    const isCopied = await copyToClipboard(text);
    if (!isCopied) {
      return;
    }

    setCopied(true);

    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
    }

    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
      copyTimerRef.current = null;
    }, 2000);
  }, [copyText]);

  return (
    <div
      {...props}
      className={clsx('rp-prompt', className)}
      style={
        {
          '--rp-prompt-accent': AGENT_ICONS[iconIndex].color,
        } as React.CSSProperties
      }
    >
      <div className="rp-prompt__backdrop" />
      <div className="rp-prompt__panel">
        <div className="rp-prompt__header">
          <div className="rp-prompt__header-main">
            <span className="rp-prompt__eyebrow">
              <RotatingIcon index={iconIndex} fading={fading} />
              {eyebrow}
            </span>
            <div className="rp-prompt__title-row">
              <div className="rp-prompt__title">{title}</div>
              {description ? (
                <p
                  className="rp-prompt__description"
                  {...renderInlineMarkdown(description)}
                />
              ) : null}
            </div>
          </div>

          <div className="rp-prompt__actions">
            <button
              type="button"
              className={clsx(
                'rp-prompt__action',
                'rp-prompt__action--copy',
                copied && 'rp-prompt__action--copied',
              )}
              onClick={handleCopy}
              title="Copy prompt"
            >
              <SvgWrapper
                icon={copied ? IconSuccess : IconCopy}
                className="rp-prompt__action-icon"
              />
              <span>{copied ? 'Copied' : 'Copy prompt'}</span>
            </button>
          </div>
        </div>

        <div
          className={clsx(
            'rp-prompt__content',
            collapsed && 'rp-prompt__content--collapsed',
          )}
        >
          <div className="rp-prompt__content-inner">
            <div className="rp-prompt__content-body" ref={contentRef}>
              {children}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="rp-prompt__toggle"
          onClick={() => {
            setCollapsed(value => !value);
          }}
          aria-expanded={!collapsed}
        >
          <span className="rp-prompt__toggle-label">
            {collapsed ? 'Expand' : 'Collapse'}
          </span>
          <SvgWrapper
            icon={IconArrowDown}
            className={clsx(
              'rp-prompt__toggle-icon',
              !collapsed && 'rp-prompt__toggle-icon--expanded',
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default Prompt;
