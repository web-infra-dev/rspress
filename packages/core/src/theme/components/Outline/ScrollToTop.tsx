import { useI18n } from '@rspress/core/runtime';
import { IconScrollToTop, SvgWrapper } from '@theme';

export function ScrollToTop() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const t = useI18n();

  return (
    <button className="rp-outline__action-row" onClick={scrollToTop}>
      <SvgWrapper icon={IconScrollToTop} width="16" height="16" />
      <span>{t('scrollToTopText')}</span>
    </button>
  );
}
