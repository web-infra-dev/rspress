import { useLocaleSiteData, useSite } from '@rspress/runtime';
import { Toc } from '@theme';
import { ReadPercent } from '../ReadPercent';
import { useDynamicToc } from '../Toc/useDynamicToc';
import './index.scss';
import { ScrollToTop } from './ScrollToTop';

export function Aside() {
  const localesData = useLocaleSiteData();
  const {
    site: { themeConfig },
  } = useSite();
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';

  const headers = useDynamicToc();

  if (headers.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-aside">
      <div className="rp-aside__title">
        {outlineTitle}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className="rp-aside__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-aside__divider" />
      <div className="rp-aside__bottom">
        <ScrollToTop />
      </div>
    </div>
  );
}
