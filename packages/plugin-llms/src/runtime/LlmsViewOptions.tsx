/**
 * Inspired from fumadocs docsite
 * @from https://github.com/fuma-nama/fumadocs/blob/5723bbe58ef805a5421a780abf235a10b251be2f/apps/docs/app/docs/%5B...slug%5D/page.client.tsx#L11
 * @license MIT
 */
import { useLang } from '@rspress/core/runtime';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  active,
  dropdownArrow,
  dropdownButton,
  dropdownItem,
  dropdownMenu,
  externalIcon,
  leftIcon,
  llmsViewOptionsContainer,
  rotated,
} from './LlmsViewOptions.module.scss';
import { useMdUrl } from './useMdUrl';

type Option =
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

interface LlmsViewOptionsProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Default options for the dropdown.
   * @default ['markdownLink', 'chatgpt', 'claude']
   * - 'chatgpt': Open in ChatGPT
   * - 'claude': Open in Claude
   */
  options?: Option[];
  /**
   * Button text by language, used with `useLang`.
   * @default en: 'Open', zh: '打开'
   */
  textByLang?: Record<string, string>;
  /**
   * Button text.
   * Priority is higher than textByLang
   * @default ''
   */
  text?: string;
}

const IconArrow = ({ className }: { className: string }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 15 16"
      fill="none"
    >
      <path
        d="M11.125 5.27885L7 9.72115L2.875 5.27885"
        stroke="#4E5969"
        strokeWidth="1.125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const IconExternalLink = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M9.33301 2H13.9997V6.66667"
        stroke="#808080"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9.82457V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6"
        stroke="#808080"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.59961 7.39996L13.6996 2.29996"
        stroke="#808080"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const LlmsViewOptions = ({
  options = ['markdownLink', 'chatgpt', 'claude'],
  text,
  textByLang = { en: 'Open', zh: '打开' },
}: LlmsViewOptionsProps) => {
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
  const lang = useLang();
  const isEn = !lang || lang === 'en';

  const items = useMemo(() => {
    const fullMarkdownUrl =
      typeof window !== 'undefined'
        ? new URL(pathname, window.location.origin).toString()
        : 'loading';
    const q = `Read ${fullMarkdownUrl}, I want to ask questions about it.`;

    return {
      markdownLink: {
        title: isEn ? 'Copy Markdown link' : '复制 Markdown 链接',
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
          >
            <g
              fill="none"
              stroke="black"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </g>
          </svg>
        ),
        onClick: () => {
          navigator.clipboard.writeText(fullMarkdownUrl);
        },
      },
      chatgpt: {
        title: isEn ? 'Open in ChatGPT' : '在 ChatGPT 中打开',
        href: `https://chatgpt.com/?${new URLSearchParams({
          hints: 'search',
          q,
        })}`,
        icon: (
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>OpenAI</title>
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
          </svg>
        ),
      },
      claude: {
        title: isEn ? 'Open in Claude' : '在 Claude 中打开',
        href: `https://claude.ai/new?${new URLSearchParams({
          q,
        })}`,
        icon: (
          <svg
            fill="currentColor"
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Anthropic</title>
            <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
          </svg>
        ),
      },
    };
  }, [pathname, isEn]);

  return (
    <>
      <button
        ref={dropdownRef}
        className={[
          dropdownButton,
          llmsViewOptionsContainer,
          isOpen ? active : '',
        ]
          .filter(Boolean)
          .join(' ')}
        type="button"
        onClick={toggleDropdown}
      >
        {text ?? textByLang[lang] ?? 'Open'}
        <IconArrow className={`${dropdownArrow} ${isOpen ? rotated : ''}`} />
        {isOpen && (
          <div className={dropdownMenu}>
            {options.map(item => {
              let displayItem = item as {
                title: string;
                href?: string;
                icon?: React.ReactNode;
                onClick?: () => void;
              };
              if (item === 'markdownLink') {
                displayItem = items.markdownLink;
              } else if (item === 'chatgpt') {
                displayItem = items.chatgpt;
              } else if (item === 'claude') {
                displayItem = items.claude;
              }
              if (displayItem.href) {
                return (
                  <a
                    key={displayItem.title}
                    className={dropdownItem}
                    href={displayItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={leftIcon}>{displayItem.icon}</span>
                    <span>{displayItem.title}</span>
                    <span className={externalIcon}>
                      <IconExternalLink />
                    </span>
                  </a>
                );
              }
              return (
                <div
                  key={displayItem.title}
                  className={dropdownItem}
                  onClick={displayItem.onClick}
                >
                  <span className={leftIcon}>{displayItem.icon}</span>
                  <span>{displayItem.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </button>
    </>
  );
};

export { LlmsViewOptions };
export type { LlmsViewOptionsProps };
