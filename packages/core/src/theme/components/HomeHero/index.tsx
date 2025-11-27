import type { FrontMatterMeta } from '@rspress/core';
import { normalizeImagePath, useFrontmatter } from '@rspress/core/runtime';
import { Button, renderHtmlOrText } from '@theme';

import './index.scss';
import clsx from 'clsx';
import { PREFIX } from '../../constant';

const DEFAULT_HERO = {
  badge: '',
  name: '',
  text: '',
  tagline: '',
  actions: [],
  image: undefined,
} satisfies FrontMatterMeta['hero'];

interface HomeHeroProps {
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
}

function HomeHero({ beforeHeroActions, afterHeroActions }: HomeHeroProps) {
  const { frontmatter } = useFrontmatter();
  const hero = frontmatter?.hero || DEFAULT_HERO;
  const hasImage = hero.image !== undefined;
  const multiHeroText = hero.text
    ? hero.text
        .toString()
        .split(/\n/g)
        .filter(text => text !== '')
    : [];
  const imageSrc =
    typeof hero.image?.src === 'string'
      ? { light: hero.image.src, dark: hero.image.src }
      : hero.image?.src || { light: '', dark: '' };

  return (
    <div
      className={clsx(`${PREFIX}home-hero`, {
        [`${PREFIX}home-hero--no-image`]: !hasImage,
      })}
    >
      <div className={`${PREFIX}home-hero__container`}>
        {hero.badge && (
          <div className={`${PREFIX}home-hero__badge`}>{hero.badge}</div>
        )}
        <div className={`${PREFIX}home-hero__content`}>
          <div className={`${PREFIX}home-hero__title`}>
            <span
              className={`${PREFIX}home-hero__title-brand`}
              {...renderHtmlOrText(hero.name)}
            ></span>
          </div>

          {multiHeroText.length !== 0 &&
            multiHeroText.map(heroText => (
              <div
                key={heroText}
                className={`${PREFIX}home-hero__subtitle`}
                {...renderHtmlOrText(heroText)}
              ></div>
            ))}
        </div>
        <p
          className={`${PREFIX}home-hero__tagline`}
          {...renderHtmlOrText(hero.tagline)}
        ></p>

        <>
          {beforeHeroActions}
          <div className={`${PREFIX}home-hero__actions`}>
            {hero.actions?.map(action => {
              return (
                <Button
                  type="a"
                  key={action.link}
                  href={action.link}
                  theme={action.theme}
                  className={`${PREFIX}home-hero__action`}
                  {...renderHtmlOrText(action.text)}
                />
              );
            })}
          </div>
          {afterHeroActions}
        </>
      </div>
      {hasImage ? (
        <div className={`${PREFIX}home-hero__image`}>
          <img
            src={normalizeImagePath(imageSrc.light)}
            alt={hero.image?.alt}
            srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
            sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
            width={375}
            height={375}
            className={`${PREFIX}home-hero__image-img rp-home-hero__image-img--light`}
          />
          <img
            src={normalizeImagePath(imageSrc.dark)}
            alt={hero.image?.alt}
            srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
            sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
            width={375}
            height={375}
            className={`${PREFIX}home-hero__image-img rp-home-hero__image-img--dark`}
          />
        </div>
      ) : null}
    </div>
  );
}

function normalizeSrcsetAndSizes(
  field: undefined | string | string[],
): string | undefined {
  const r = (Array.isArray(field) ? field : [field]).filter(Boolean).join(', ');
  return r || undefined;
}

export { HomeHero };
export type { HomeHeroProps };
