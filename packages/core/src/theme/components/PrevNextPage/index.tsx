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
    <div className="rp-prev-next-page">
      {prevPage ? (
        <Link
          href={prevPage.link}
          className={clsx('rp-prev-next-page__item', 'rp-prev-next-page__prev')}
        >
          <span className="rp-prev-next-page__item__desc">{prevPageText}</span>
          <span className="rp-prev-next-page__item__title">
            <SvgWrapper
              icon={ArrowRight}
              className="rp-prev-next-page__icon rp-prev-next-page__rotate_180"
            />
            <span {...renderInlineMarkdown(prevPage.text)} />
          </span>
        </Link>
      ) : (
        <div className="rp-prev-next-page__placeholder" />
      )}
      {nextPage ? (
        <Link
          href={nextPage.link}
          className={clsx('rp-prev-next-page__item', 'rp-prev-next-page__next')}
        >
          <span className="rp-prev-next-page__item__desc">{nextPageText}</span>
          <span className="rp-prev-next-page__item__title">
            <span {...renderInlineMarkdown(nextPage.text)} />
            <SvgWrapper icon={ArrowRight} className="rp-prev-next-page__icon" />
          </span>
        </Link>
      ) : (
        <div className="rp-prev-next-page__placeholder" />
      )}
    </div>
  );
}
