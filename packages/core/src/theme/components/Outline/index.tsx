import { useLocaleSiteData, useSite } from '@rspress/core/runtime';
import { Toc, useDynamicToc } from '@theme';
import { ReadPercent } from '../ReadPercent';
import './index.scss';
import { ScrollToTop } from './ScrollToTop';

export function Outline() {
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
    <div className="rp-outline">
      <div className="rp-outline__title">
        {outlineTitle}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className="rp-outline__toc rp-scrollbar">
        <Toc />
      </nav>
      <div className="rp-outline__divider" />
      <div className="rp-outline__bottom">
        <ScrollToTop />
      </div>
    </div>
  );
}
