import { useI18n } from '@rspress/core/runtime';
import {
  Link,
  renderInlineMarkdown,
  SvgWrapper,
  usePrevNextPage,
} from '@theme';
import ArrowRight from '@theme-assets/arrow-right';
import clsx from 'clsx';
import './index.scss';
import { PREFIX } from '../../constant';

export function PrevNextPage() {
  const { prevPage, nextPage } = usePrevNextPage();
  const t = useI18n();

  return (
    <div className={`${PREFIX}prev-next-page`}>
      {prevPage ? (
        <Link
          href={prevPage.link}
          className={clsx(
            `${PREFIX}prev-next-page__item`,
            `${PREFIX}prev-next-page__prev`,
          )}
        >
          <span className={`${PREFIX}prev-next-page__item__desc`}>
            {t('prevPageText')}
          </span>
          <span className={`${PREFIX}prev-next-page__item__title`}>
            <SvgWrapper
              icon={ArrowRight}
              className={`${PREFIX}prev-next-page__icon ${PREFIX}prev-next-page__rotate_180`}
            />
            <span {...renderInlineMarkdown(prevPage.text)} />
          </span>
        </Link>
      ) : (
        <div className={`${PREFIX}prev-next-page__placeholder`} />
      )}
      {nextPage ? (
        <Link
          href={nextPage.link}
          className={clsx(
            `${PREFIX}prev-next-page__item`,
            `${PREFIX}prev-next-page__next`,
          )}
        >
          <span className={`${PREFIX}prev-next-page__item__desc`}>
            {t('nextPageText')}
          </span>
          <span className={`${PREFIX}prev-next-page__item__title`}>
            <span {...renderInlineMarkdown(nextPage.text)} />
            <SvgWrapper
              icon={ArrowRight}
              className={`${PREFIX}prev-next-page__icon`}
            />
          </span>
        </Link>
      ) : (
        <div className={`${PREFIX}prev-next-page__placeholder`} />
      )}
    </div>
  );
}
