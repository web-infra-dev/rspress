import { useI18n } from '@rspress/core/runtime';
import './ScrollToTop.scss';

export function ScrollToTop() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const t = useI18n();

  return (
    <button className="rp-outline__scroll-to-top" onClick={scrollToTop}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.99967 14.6667C11.6816 14.6667 14.6663 11.6819 14.6663 8.00001C14.6663 4.31811 11.6816 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667Z"
          stroke="currentColor"
          strokeOpacity="0.8"
          strokeWidth="1.33333"
        />
        <path
          d="M7.99967 14.6667C11.6816 14.6667 14.6663 11.6819 14.6663 8.00001C14.6663 4.31811 11.6816 1.33334 7.99967 1.33334C4.31777 1.33334 1.33301 4.31811 1.33301 8.00001C1.33301 11.6819 4.31777 14.6667 7.99967 14.6667Z"
          stroke="currentColor"
          strokeOpacity="0.8"
          strokeWidth="1.33333"
          strokeLinejoin="round"
        />
        <path
          d="M11 9L8 6L5 9"
          stroke="currentColor"
          strokeOpacity="0.8"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span>{t('scrollToTopText')}</span>
    </button>
  );
}
