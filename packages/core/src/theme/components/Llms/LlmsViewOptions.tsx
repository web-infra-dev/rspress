/**
 * Inspired from fumadocs docsite
 * @from https://github.com/fuma-nama/fumadocs/blob/5723bbe58ef805a5421a780abf235a10b251be2f/apps/docs/app/docs/%5B...slug%5D/page.client.tsx#L11
 * @license MIT
 */
import { useI18n, useSite } from '@rspress/core/runtime';
import {
  copyToClipboard,
  IconAnthropic,
  IconDown,
  IconExternalLink,
  IconLink,
  IconOpenAI,
  SvgWrapper,
} from '@rspress/core/theme';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './index.scss';
import './LlmsViewOptions.scss';
import { useMdUrl } from './useMdUrl';

export type LlmsViewOptionsItem =
  | {
      title: string;
      icon?: React.ReactNode;
      onClick?: () => void;
    }
  | {
      title: string;
      href: string;
      icon?: React.ReactNode;
    }
  | 'markdownLink'
  | 'chatgpt'
  | 'claude';

type MenuItem = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

export interface LlmsViewOptionsProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Default options for the dropdown.
   * @default ['markdownLink', 'chatgpt', 'claude']
   * - 'chatgpt': Open in ChatGPT
   * - 'claude': Open in Claude
   *
   * Unlike `themeConfig.llmsUI.viewOptions`, component options can use
   * ReactNode icons and onClick callbacks.
   */
  options?: LlmsViewOptionsItem[];
  /**
   * Button text by language, used with `useLang`.
   * @default en: 'Open', zh: '\u6253\u5f00'
   */
  textByLang?: Record<string, string>;
  /**
   * Button text.
   * Priority is higher than textByLang
   * @default ''
   */
  text?: string;
}

const DEFAULT_OPTIONS: LlmsViewOptionsItem[] = [
  'markdownLink',
  'chatgpt',
  'claude',
];

export function LlmsViewOptions({
  options: propsOptions,
}: LlmsViewOptionsProps) {
  const { site } = useSite();
  const llmsUI = site?.themeConfig?.llmsUI;
  const configuredOptions =
    typeof llmsUI === 'object' ? llmsUI?.viewOptions : propsOptions;
  const options =
    configuredOptions === false ? [] : (configuredOptions ?? DEFAULT_OPTIONS);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const { pathname } = useMdUrl();
  const t = useI18n();

  const items = useMemo(() => {
    const fullMarkdownUrl =
      typeof window !== 'undefined'
        ? new URL(pathname, window.location.origin).toString()
        : 'loading';
    const q = `Read ${fullMarkdownUrl}, I want to ask questions about it.`;

    return {
      markdownLink: {
        title: t('copyMarkdownLinkText'),
        icon: <SvgWrapper icon={IconLink} />,
        onClick: () => {
          void copyToClipboard(fullMarkdownUrl);
        },
      },
      chatgpt: {
        title: t('openInText', { name: 'ChatGPT' }),
        href: `https://chatgpt.com/?${new URLSearchParams({
          hints: 'search',
          q,
        })}`,
        icon: <SvgWrapper icon={IconOpenAI} />,
      },
      claude: {
        title: t('openInText', { name: 'Claude' }),
        href: `https://claude.ai/new?${new URLSearchParams({
          q,
        })}`,
        icon: <SvgWrapper icon={IconAnthropic} />,
      },
    };
  }, [pathname, t]);

  const renderableItems = useMemo(
    () =>
      options
        .map((option): MenuItem | null => {
          if (option === 'markdownLink') {
            return items.markdownLink;
          }
          if (option === 'chatgpt') {
            return items.chatgpt;
          }
          if (option === 'claude') {
            return items.claude;
          }
          if (
            typeof option === 'object' &&
            'title' in option &&
            typeof option.title === 'string' &&
            ('href' in option || 'onClick' in option)
          ) {
            return option;
          }
          return null;
        })
        .filter((item): item is MenuItem => item !== null),
    [items, options],
  );

  if (renderableItems.length === 0) {
    return null;
  }

  return (
    <>
      <button
        ref={dropdownRef}
        onClick={toggleDropdown}
        className={`rp-llms-button rp-llms-view-options__trigger ${
          isOpen ? 'rp-llms-view-options__trigger--active' : ''
        }`}
      >
        <SvgWrapper
          icon={IconDown}
          className={`rp-llms-view-options__arrow ${isOpen ? 'rp-llms-view-options__arrow--rotated' : ''}`}
        />
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
                <div
                  key={item.title}
                  className="rp-llms-view-options__menu-item"
                  onClick={item.onClick}
                >
                  <span className="rp-llms-view-options__item-icon">
                    {item.icon}
                  </span>
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </button>
    </>
  );
}
