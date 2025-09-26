import { useLocaleSiteData, useLocation, useSite } from '@rspress/runtime';
import { useEffect } from 'react';

import './index.scss';
import { scrollToTarget } from '../../logic/sideEffects';
import { ProgressCircle } from './ProgressCircle';
import { ScrollToTop } from './ScrollToTop';
import { TocItem } from './TocItem';
import { useActiveAnchor } from './useActiveAnchor';
import { useDynamicToc } from './useDynamicToc';
import { useReadPercent } from './useReadPercent';

export function Aside() {
  const localesData = useLocaleSiteData();
  const {
    site: { themeConfig },
  } = useSite();
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';

  const headers = useDynamicToc();
  const [readPercent] = useReadPercent();

  // For outline text highlight
  const baseHeaderLevel = 2;

  const { pathname } = useLocation();

  const activeAnchorId = useActiveAnchor(headers, readPercent === 100);

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
        <ProgressCircle percent={readPercent} size={14} strokeWidth={2} />
      </div>
      <nav className="rp-aside__toc">
        {headers.map((header, index) => (
          <TocItem
            key={`${header.depth}_${header.text}_${header.id}_${index}`}
            baseHeaderLevel={baseHeaderLevel}
            header={header}
            active={activeAnchorId === header.id}
          />
        ))}
      </nav>
      <div className="rp-aside__divider" />
      <div className="rp-aside__bottom">
        <ScrollToTop />
      </div>
    </div>
  );
}
