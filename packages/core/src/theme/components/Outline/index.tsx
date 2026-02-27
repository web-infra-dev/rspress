import { useI18n, useSite } from '@rspress/core/runtime';
import { ReadPercent, Toc, useDynamicToc } from '@theme';
import './index.scss';
import { EditLinkRow } from './EditLinkRow';
import { ScrollToTop } from './ScrollToTop';

export function Outline() {
  const t = useI18n();

  const headers = useDynamicToc();
  const {
    site: {
      themeConfig: { enableScrollToTop = true },
    },
  } = useSite();

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
        {enableScrollToTop && <ScrollToTop />}
        <EditLinkRow />
      </div>
    </div>
  );
}
