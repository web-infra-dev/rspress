import { useI18n } from '@rspress/core/runtime';
import {
  IconArrowRight,
  Link,
  renderInlineMarkdown,
  SvgWrapper,
  usePrevNextPage,
} from '@theme';
import clsx from 'clsx';
import './index.scss';

export function PrevNextPage() {
  const { prevPage, nextPage } = usePrevNextPage();
  const t = useI18n();

  return (
    <div className="rp-prev-next-page">
      {prevPage ? (
        <Link
          href={prevPage.link}
          className={clsx('rp-prev-next-page__item', 'rp-prev-next-page__prev')}
        >
          <span className="rp-prev-next-page__item__desc">
            {t('prevPageText')}
          </span>
          <span className="rp-prev-next-page__item__title">
            <SvgWrapper
              icon={IconArrowRight}
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
          <span className="rp-prev-next-page__item__desc">
            {t('nextPageText')}
          </span>
          <span className="rp-prev-next-page__item__title">
            <span {...renderInlineMarkdown(nextPage.text)} />
            <SvgWrapper
              icon={IconArrowRight}
              className="rp-prev-next-page__icon"
            />
          </span>
        </Link>
      ) : (
        <div className="rp-prev-next-page__placeholder" />
      )}
    </div>
  );
}
