import { useLocaleSiteData, useLocation, useSite } from '@rspress/runtime';
import { Toc } from '@theme';
import { useEffect } from 'react';
import { scrollToTarget } from '../../logic/sideEffects';
import { useDynamicToc } from '../Toc/useDynamicToc';
import './index.scss';
import { ReadPercent } from '../ReadPercent';
import { ScrollToTop } from './ScrollToTop';

export function Aside() {
  const localesData = useLocaleSiteData();
  const {
    site: { themeConfig },
  } = useSite();
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';

  const headers = useDynamicToc();

  const { pathname } = useLocation();

  useEffect(() => {
    const decodedHash = decodeURIComponent(window.location.hash);
    console.log('decodedHash', decodedHash);
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target, false, 0);
        target.scrollIntoView();
      }
    }
  }, [pathname]);

  if (headers.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-aside">
      <div className="rp-aside__title">
        {outlineTitle}
        <ReadPercent size={14} strokeWidth={2} />
      </div>
      <nav className="rp-aside__toc">
        <Toc />
      </nav>
      <div className="rp-aside__divider" />
      <div className="rp-aside__bottom">
        <ScrollToTop />
      </div>
    </div>
  );
}
