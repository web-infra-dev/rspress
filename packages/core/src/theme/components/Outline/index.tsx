import { useI18n, useSite } from '@rspress/core/runtime';
import { Toc, useDynamicToc } from '@theme';
import { ReadPercent } from '../ReadPercent';
import './index.scss';
import { ScrollToTop } from './ScrollToTop';

export function Outline() {
  const t = useI18n();

  const headers = useDynamicToc();
  const { site } = useSite();

  if (headers.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-outline">
      <div className="rp-outline__title">
        {t('outlineTitle')}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className="rp-outline__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-outline__divider" />
      <div className="rp-outline__bottom">
        {site.themeConfig?.enableScrollToTop ?? <ScrollToTop />}
      </div>
    </div>
  );
}
