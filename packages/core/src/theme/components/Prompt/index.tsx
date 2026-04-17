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
import './index.scss';

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
  title = 'Agent Prompt',
  ...props
}: PromptProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    <div {...props} className={clsx('rp-prompt', className)}>
      <div className="rp-prompt__backdrop" />
      <div className="rp-prompt__panel">
        <div className="rp-prompt__header">
          <div className="rp-prompt__header-main">
            <span className="rp-prompt__eyebrow">For your agent</span>
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
            <button
              type="button"
              className="rp-prompt__action rp-prompt__action--toggle"
              onClick={() => {
                setCollapsed(value => !value);
              }}
              aria-expanded={!collapsed}
              title={collapsed ? 'Expand prompt' : 'Collapse prompt'}
            >
              <span>{collapsed ? 'Expand' : 'Collapse'}</span>
              <SvgWrapper
                icon={IconArrowDown}
                className={clsx(
                  'rp-prompt__action-icon',
                  'rp-prompt__toggle-icon',
                  !collapsed && 'rp-prompt__toggle-icon--expanded',
                )}
              />
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
      </div>
    </div>
  );
}

export default Prompt;
