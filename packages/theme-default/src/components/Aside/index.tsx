import { useLocaleSiteData, useLocation, useSite } from '@rspress/runtime';
import { useEffect, useMemo } from 'react';
import { scrollToTarget } from '../../logic/sideEffects';
import { type UISwitchResult, useUISwitch } from '../../logic/useUISwitch.js';

import './index.scss';
import { ProgressCircle } from './ProgressCircle';
import { ScrollToTop } from './ScrollToTop';
import { TocItem } from './TocItem';
import { useActiveAnchor } from './useActiveAnchor';
import { useDynamicToc } from './useDynamicToc';
import { useReadPercent } from './useReadPercent';

export interface AsideProps {
  outlineTitle: string;
  uiSwitch?: UISwitchResult;
}

export function Aside() {
  const localesData = useLocaleSiteData();
  const {
    site: { themeConfig },
  } = useSite();
  const outlineTitle =
    localesData?.outlineTitle || themeConfig?.outlineTitle || 'ON THIS PAGE';

  const { scrollPaddingTop } = useUISwitch();
  const headers = useDynamicToc();
  const [readPercent] = useReadPercent();

  // For outline text highlight
  const baseHeaderLevel = 2;

  const { hash: locationHash = '', pathname } = useLocation();
  const decodedHash: string = useMemo(
    () => decodeURIComponent(locationHash),
    [locationHash],
  );

  const activeAnchorId = useActiveAnchor(headers, readPercent === 100);

  useEffect(() => {
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    } else {
      const target = document.getElementById(decodedHash.slice(1));
      if (target) {
        scrollToTarget(target, false, scrollPaddingTop);
      }
    }
  }, [decodedHash, headers, pathname]);

  if (headers.length === 0) {
    return <></>;
  }

  return (
    <div className="rp-aside">
      <div className="rp-aside__title">
        {outlineTitle}
        <ProgressCircle percent={readPercent} size={14} strokeWidth={2} />
      </div>
      <nav>
        <ul className="rp-aside__toc">
          {headers.map((header, index) => (
            <TocItem
              key={`${header.depth}_${header.text}_${header.id}_${index}`}
              baseHeaderLevel={baseHeaderLevel}
              header={header}
              active={activeAnchorId === header.id}
            />
          ))}
        </ul>
      </nav>

      <div style={{ display: readPercent !== 0 ? '' : 'none' }}>
        <div className="rp-aside__divider" />
        <ScrollToTop />
      </div>
    </div>
  );
}
