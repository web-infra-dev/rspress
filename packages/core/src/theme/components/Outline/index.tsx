import { useI18n, useSite } from '@rspress/core/runtime';
import { ReadPercent, Toc, useDynamicToc } from '@theme';
import './index.scss';
import { PREFIX } from '../../constant';
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
    <div className={`${PREFIX}outline`}>
      <div className={`${PREFIX}outline__title`}>
        {t('outlineTitle')}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className={`${PREFIX}outline__toc rp-scrollbar`}>
        <Toc />
      </nav>
      <div className={`${PREFIX}outline__divider`} />
      <div className={`${PREFIX}outline__bottom`}>
        {enableScrollToTop && <ScrollToTop />}
      </div>
    </div>
  );
}
