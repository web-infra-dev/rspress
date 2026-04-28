import { useI18n } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconArrowDown,
  IconCopy,
  IconSuccess,
  renderInlineMarkdown,
  SvgWrapper,
} from '@rspress/core/theme';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AGENT_ICONS } from './icons';
import './index.scss';

const ROTATE_INTERVAL = 3500;
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

function useRotatingIcon() {
  const [iconIndex, setIconIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const rotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      rotateTimeoutRef.current = setTimeout(() => {
        setIconIndex(prev => (prev + 1) % AGENT_ICONS.length);
        setFading(false);
        rotateTimeoutRef.current = null;
      }, FADE_DURATION);
    }, ROTATE_INTERVAL);
    return () => {
      clearInterval(timer);
      if (rotateTimeoutRef.current) {
        clearTimeout(rotateTimeoutRef.current);
      }
    };
  }, []);

  return { fading, iconIndex };
}

export interface PromptProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render custom MDX content without copy or collapse behavior.
   * @default false
   */
  custom?: boolean;
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
  prompt?: string;
}

function CustomPrompt({
  children,
  className,
  defaultCollapsed: _defaultCollapsed,
  description: _description,
  eyebrow = 'For your Agent',
  prompt: _prompt,
  style,
  title: _title,
  ...props
}: PromptProps) {
  const { fading, iconIndex } = useRotatingIcon();

  return (
    <div
      {...props}
      className={clsx('rp-prompt', 'rp-prompt--custom', className)}
      style={
        {
          '--rp-prompt-accent': AGENT_ICONS[iconIndex].color,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className="rp-prompt__backdrop" />
      <div className="rp-prompt__panel">
        <div className="rp-prompt__meta">
          <span className="rp-prompt__eyebrow">
            <RotatingIcon index={iconIndex} fading={fading} />
            {eyebrow}
          </span>
        </div>
        <div className="rp-prompt__custom-content">{children}</div>
      </div>
    </div>
  );
}

function CopyablePrompt({
  className,
  defaultCollapsed = true,
  description,
  eyebrow = 'For your Agent',
  onClick,
  prompt,
  style,
  title = 'Agent Prompt',
  ...props
}: PromptProps) {
  const t = useI18n();
  const contentId = useId();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);
  const { fading, iconIndex } = useRotatingIcon();
  const [ripples, setRipples] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

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

  const handleCardActivate = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (e.defaultPrevented) {
        return;
      }

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
        rippleTimersRef.current.delete(timer);
      }, 600);
      rippleTimersRef.current.add(timer);

      void handleCopy();
    },
    [handleCopy, onClick],
  );

  return (
    <div
      {...props}
      ref={cardRef}
      className={clsx('rp-prompt', className)}
      style={
        {
          '--rp-prompt-accent': AGENT_ICONS[iconIndex].color,
          ...style,
        } as React.CSSProperties
      }
      onClick={handleCardActivate}
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
                  void handleCopy();
                }}
                title={t('promptCopyText')}
              >
                <SvgWrapper
                  icon={copied ? IconSuccess : IconCopy}
                  className="rp-prompt__action-icon"
                />
                <span>
                  {copied ? t('promptCopiedText') : t('promptCopyText')}
                </span>
              </button>
              <button
                type="button"
                className="rp-prompt__action-toggle"
                onClick={e => {
                  e.stopPropagation();
                  setCollapsed(value => !value);
                }}
                aria-controls={contentId}
                aria-expanded={!collapsed}
                title={
                  collapsed ? t('promptExpandText') : t('promptCollapseText')
                }
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
          id={contentId}
          className={clsx(
            'rp-prompt__content',
            collapsed && 'rp-prompt__content--collapsed',
          )}
          aria-hidden={collapsed}
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

export function Prompt({ custom = false, ...props }: PromptProps) {
  return custom ? <CustomPrompt {...props} /> : <CopyablePrompt {...props} />;
}

export default Prompt;
