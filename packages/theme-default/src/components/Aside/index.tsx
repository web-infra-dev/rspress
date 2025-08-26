import { useLocation } from '@rspress/runtime';
import { useEffect, useMemo } from 'react';
import { scrollToTarget } from '../../logic/sideEffects';
import { type UISwitchResult, useUISwitch } from '../../logic/useUISwitch.js';

import * as styles from './index.module.scss';
import { ScrollToTop } from './ScrollToTop';
import { TocItem } from './TocItem';
import { useActiveAnchor } from './useActiveAnchor';
import { useDynamicToc } from './useDynamicToc';
import { useReadPercent } from './useReadPercent';

export interface AsideProps {
  outlineTitle: string;
  uiSwitch?: UISwitchResult;
}

export function Aside({ outlineTitle }: { outlineTitle: string }) {
  const { scrollPaddingTop } = useUISwitch();
  const headers = useDynamicToc();
  const [readPercent] = useReadPercent();
  console.log(readPercent, 'readPercent');

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
    <div className="rp-flex rp-flex-col">
      <div
        id="aside-container"
        className="rp-relative rp-text-sm rp-font-medium"
      >
        <div className={styles.outlineTitle}>{outlineTitle}</div>
        <nav className="rp-mt-1">
          <ul className="rp-relative">
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
      </div>

      <div style={{ display: readPercent !== 0 ? '' : 'none' }}>
        <div className={styles.divider} />
        <ScrollToTop />
      </div>
    </div>
  );
}
