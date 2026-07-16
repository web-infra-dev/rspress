import { useI18n, useSite } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconAnthropic,
  IconExternalLink,
  IconLink,
  IconOpenAI,
  IconOpenInChat,
  SvgWrapper,
} from '@rspress/core/theme';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './LlmsOpenRow.scss';
import './LlmsViewOptions.scss';
import { useMdUrl } from './useMdUrl';

type MenuItem = {
  title: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
};

const DEFAULT_OPTIONS = ['markdownLink', 'chatgpt', 'claude'] as const;

export function LlmsOpenRow() {
  const t = useI18n();
  const { pathname } = useMdUrl();
  const { site } = useSite();
  const llmsUI = site?.themeConfig?.llmsUI;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options =
    typeof llmsUI === 'object'
      ? llmsUI.viewOptions === false
        ? []
        : (llmsUI.viewOptions ?? DEFAULT_OPTIONS)
      : DEFAULT_OPTIONS;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fullMarkdownUrl = useMemo(
    () =>
      typeof window !== 'undefined'
        ? new URL(pathname, window.location.origin).toString()
        : '',
    [pathname],
  );

  const q = `Read ${fullMarkdownUrl}, I want to ask questions about it.`;

  const builtinItems: Record<string, MenuItem> = useMemo(
    () => ({
      markdownLink: {
        title: t('copyMarkdownLinkText'),
        icon: <SvgWrapper icon={IconLink} />,
        onClick: () => {
          void copyToClipboard(fullMarkdownUrl);
        },
      },
      chatgpt: {
        title: t('openInText', { name: 'ChatGPT' }),
        href: `https://chatgpt.com/?${new URLSearchParams({ hints: 'search', q })}`,
        icon: <SvgWrapper icon={IconOpenAI} />,
      },
      claude: {
        title: t('openInText', { name: 'Claude' }),
        href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
        icon: <SvgWrapper icon={IconAnthropic} />,
      },
    }),
    [fullMarkdownUrl, t, q],
  );

  const renderableItems = useMemo(
    () =>
      options
        .map((option): MenuItem | null => {
          return builtinItems[option] ?? null;
        })
        .filter((item): item is MenuItem => item !== null),
    [options, builtinItems],
  );

  if (!pathname || renderableItems.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="rp-outline__open-in-wrapper">
      <button
        className="rp-outline__action-row"
        onClick={() => setIsOpen(!isOpen)}
      >
        <SvgWrapper icon={IconOpenInChat} />
        <span>{t('openInText', { name: 'chat' })}</span>
      </button>
      {isOpen && (
        <div className="rp-llms-view-options__menu">
          {renderableItems.map(item => {
            if (item.href) {
              return (
                <a
                  key={item.title}
                  className="rp-llms-view-options__menu-item"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="rp-llms-view-options__item-icon">
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                  <span className="rp-llms-view-options__external-icon">
                    <SvgWrapper icon={IconExternalLink} />
                  </span>
                </a>
              );
            }
            return (
              <button
                type="button"
                key={item.title}
                className="rp-llms-view-options__menu-item"
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
              >
                <span className="rp-llms-view-options__item-icon">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
