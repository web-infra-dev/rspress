import { useI18n, useSite } from '@rspress/core/runtime';
import { IconExternalLink } from '@theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import '../Llms/LlmsViewOptions.scss';
import { useMdUrl } from '../Llms/useMdUrl';

export function LlmsOpenRow() {
  const t = useI18n();
  const { pathname } = useMdUrl();
  const { site } = useSite();
  const llmsUI = site?.themeConfig?.llmsUI;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options =
    typeof llmsUI === 'object' && llmsUI?.viewOptions
      ? llmsUI.viewOptions
      : (['chatgpt', 'claude'] as const);

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

  const builtinItems: Record<
    string,
    { title: string; href: string; icon: React.ReactNode }
  > = useMemo(
    () => ({
      chatgpt: {
        title: t('openInText', { name: 'ChatGPT' }),
        href: `https://chatgpt.com/?${new URLSearchParams({ hints: 'search', q })}`,
        icon: (
          <svg
            role="img"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
          >
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
          </svg>
        ),
      },
      claude: {
        title: t('openInText', { name: 'Claude' }),
        href: `https://claude.ai/new?${new URLSearchParams({ q })}`,
        icon: (
          <svg
            fill="currentColor"
            role="img"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
          >
            <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
          </svg>
        ),
      },
    }),
    [t, q],
  );

  if (!pathname) {
    return null;
  }

  return (
    <div ref={containerRef} className="rp-outline__open-in-wrapper">
      <button
        className="rp-outline__action-row"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span>{t('openInText', { name: 'chat' })}</span>
      </button>
      {isOpen && (
        <div className="rp-llms-view-options__menu">
          {options.map(option => {
            let item: {
              title: string;
              href?: string;
              icon?: React.ReactNode;
              onClick?: () => void;
            };
            if (typeof option === 'string' && builtinItems[option]) {
              item = builtinItems[option];
            } else if (typeof option === 'object' && 'title' in option) {
              item = option;
            } else {
              return null;
            }
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
              <div
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
