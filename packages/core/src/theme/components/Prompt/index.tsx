import {
  copyToClipboard,
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

const ROTATE_INTERVAL = 3000;
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
   * @default 'For your Agent'
   */
  eyebrow?: string;
  /**
   * Controls the initial folded state.
   * @default true
   */
  defaultCollapsed?: boolean;
  /**
   * The prompt text to display and copy.
   */
  prompt: string;
}

export function Prompt({
  className,
  defaultCollapsed = true,
  description,
  eyebrow = 'For your Agent',
  prompt,
  title = 'Agent Prompt',
  ...props
}: PromptProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);
  const [iconIndex, setIconIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

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
      copyTimerRef.current && clearTimeout(copyTimerRef.current);
      rippleTimersRef.current.forEach(clearTimeout);
      rippleTimersRef.current.clear();
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!prompt) {
      return;
    }

    const isCopied = await copyToClipboard(prompt);
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
  }, [prompt]);

  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (window.getSelection()?.toString()) {
        return;
      }

      const target = e.target as HTMLElement;
      if (
        target.closest(
          'a, button, .rp-prompt__action-copy, .rp-prompt__action-toggle',
        )
      ) {
        return;
      }

      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const id = Date.now() + Math.random();
      setRipples(prev => [
        ...prev,
        { id, x: e.clientX - rect.left, y: e.clientY - rect.top },
      ]);
      const timer = setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
      rippleTimersRef.current.add(timer);

      handleCopy();
    },
    [handleCopy],
  );

  return (
    <div
      {...props}
      ref={cardRef}
      className={clsx('rp-prompt', className)}
      style={
        {
          '--rp-prompt-accent': AGENT_ICONS[iconIndex].color,
        } as React.CSSProperties
      }
      onClick={handleCardClick}
    >
      <div className="rp-prompt__backdrop" />
      {ripples.map(r => (
        <span
          key={r.id}
          className="rp-prompt__ripple"
          style={{ left: r.x, top: r.y }}
        />
      ))}
      <div className="rp-prompt__panel">
        <div className="rp-prompt__header">
          <div
            className={clsx(
              'rp-prompt__meta',
              copied && 'rp-prompt__meta--copied',
            )}
          >
            <span className="rp-prompt__eyebrow">
              <RotatingIcon index={iconIndex} fading={fading} />
              {eyebrow}
            </span>
          </div>
          <div className="rp-prompt__header-row">
            <div className="rp-prompt__header-left">
              <div className="rp-prompt__title-with-icon">
                <div className="rp-prompt__title">{title}</div>
              </div>
              {description ? (
                <p
                  className="rp-prompt__description"
                  {...renderInlineMarkdown(description)}
                />
              ) : null}
            </div>
            <div className="rp-prompt__header-actions">
              <button
                type="button"
                className={clsx(
                  'rp-prompt__action-copy',
                  copied && 'rp-prompt__action-copy--copied',
                )}
                onClick={e => {
                  e.stopPropagation();
                  handleCopy();
                }}
                title="Copy prompt"
              >
                <SvgWrapper
                  icon={copied ? IconSuccess : IconCopy}
                  className="rp-prompt__action-icon"
                />
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
              <button
                type="button"
                className="rp-prompt__action-toggle"
                onClick={e => {
                  e.stopPropagation();
                  setCollapsed(value => !value);
                }}
                aria-expanded={!collapsed}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                <SvgWrapper
                  icon={IconArrowDown}
                  className={clsx(
                    'rp-prompt__action-toggle-icon',
                    !collapsed && 'rp-prompt__action-toggle-icon--expanded',
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        <div
          className={clsx(
            'rp-prompt__content',
            collapsed && 'rp-prompt__content--collapsed',
          )}
        >
          <div className="rp-prompt__content-inner">
            <div
              className="rp-prompt__content-body"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {prompt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prompt;
