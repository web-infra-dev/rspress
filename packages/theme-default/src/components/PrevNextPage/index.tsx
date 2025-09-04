import { useLocaleSiteData } from '@rspress/runtime';
import { Link, renderInlineMarkdown, usePrevNextPage } from '@theme';
import ArrowRight from '@theme-assets/arrow-right';
import clsx from 'clsx';
import { SvgWrapper } from '../SvgWrapper';
import * as styles from './index.module.scss';

export function PrevNextPage() {
  const { prevPageText = 'Previous', nextPageText = 'Next' } =
    useLocaleSiteData();
  const { prevPage, nextPage } = usePrevNextPage();

  return (
    <div className={styles.prevNextPage}>
      {prevPage && (
        <Link
          href={prevPage.link}
          className={clsx(styles.prevNextPageItem, styles.prev)}
        >
          <span className={styles.desc}>{prevPageText}</span>
          <span className={styles.title}>
            <SvgWrapper icon={ArrowRight} className={styles.icon} />
            <span {...renderInlineMarkdown(prevPage.text)} />
          </span>
        </Link>
      )}
      {nextPage && (
        <Link
          href={nextPage.link}
          className={clsx(styles.prevNextPageItem, styles.next)}
        >
          <span className={styles.desc}>{nextPageText}</span>
          <span className={styles.title}>
            <span {...renderInlineMarkdown(nextPage.text)} />
            <SvgWrapper icon={ArrowRight} className={styles.icon} />
          </span>
        </Link>
      )}
    </div>
  );
}
