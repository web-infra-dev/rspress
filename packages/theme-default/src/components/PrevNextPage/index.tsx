import { useLocaleSiteData } from '@rspress/runtime';
import { Link, renderInlineMarkdown, usePrevNextPage } from '@theme';
import ArrowRight from '@theme-assets/arrow-right';
import clsx from 'clsx';
import { SvgWrapper } from '../SvgWrapper';
import './index.scss';

export function PrevNextPage() {
  const { prevPageText = 'Previous', nextPageText = 'Next' } =
    useLocaleSiteData();
  const { prevPage, nextPage } = usePrevNextPage();

  return (
    <div className="rp-prevNextPage">
      {prevPage ? (
        <Link
          href={prevPage.link}
          className={clsx('rp-prevNextPage__item', 'rp-prevNextPage__prev')}
        >
          <span className="rp-prevNextPage__item__desc">{prevPageText}</span>
          <span className="rp-prevNextPage__item__title">
            <SvgWrapper
              icon={ArrowRight}
              className="rp-prevNextPage__icon rp-prevNextPage__rotate_180"
            />
            <span {...renderInlineMarkdown(prevPage.text)} />
          </span>
        </Link>
      ) : (
        <div className="rp-prevNextPage__placeHolder" />
      )}
      {nextPage ? (
        <Link
          href={nextPage.link}
          className={clsx('rp-prevNextPage__item', 'rp-prevNextPage__next')}
        >
          <span className="rp-prevNextPage__item__desc">{nextPageText}</span>
          <span className="rp-prevNextPage__item__title">
            <span {...renderInlineMarkdown(nextPage.text)} />
            <SvgWrapper icon={ArrowRight} className="rp-prevNextPage__icon" />
          </span>
        </Link>
      ) : (
        <div className="rp-prevNextPage__placeHolder" />
      )}
    </div>
  );
}
