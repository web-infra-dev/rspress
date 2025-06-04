import { normalizeHrefInRuntime, normalizeImagePath } from '@rspress/runtime';
import { isExternalUrl, withBase } from '@rspress/shared';
import type { FrontMatterMeta } from '@rspress/shared';
import { Button } from '@theme';

import { renderHtmlOrText } from '../../logic/utils';
import * as styles from './index.module.scss';

const DEFAULT_HERO = {
  name: '',
  text: '',
  tagline: '',
  actions: [],
  image: undefined,
} satisfies FrontMatterMeta['hero'];

interface HomeHeroProps {
  frontmatter: FrontMatterMeta;
  routePath: string;
  beforeHeroActions?: React.ReactNode;
  afterHeroActions?: React.ReactNode;
}

function HomeHero({
  beforeHeroActions,
  afterHeroActions,
  frontmatter,
  routePath,
}: HomeHeroProps) {
  const hero = frontmatter?.hero || DEFAULT_HERO;
  const hasImage = hero.image !== undefined;
  const textMaxWidth = hasImage ? 'sm:max-w-xl' : 'sm:max-w-4xl';
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
    <div className="rp-m-auto rp-pt-0 rp-px-6 rp-pb-12 sm:rp-pt-10 sm:rp-px-16 md:rp-pt-16 md:rp-px-16 md:rp-pb-16 rp-relative">
      <div
        className={styles.mask}
        style={{
          left: hasImage ? '75%' : '50%',
        }}
      ></div>
      <div className="rp-m-auto rp-flex rp-flex-col md:rp-flex-row rp-max-w-6xl rp-min-h-[50vh] rp-mt-12 sm:rp-mt-0">
        <div className="rp-flex rp-flex-col rp-justify-center rp-items-center rp-text-center rp-max-w-xl sm:rp-max-w-4xl rp-m-auto rp-order-2 md:rp-order-1">
          <h1 className="rp-font-bold rp-text-3xl rp-pb-2 sm:rp-text-6xl md:rp-text-7xl rp-m-auto sm:rp-m-4 md:rp-m-0 md:rp-pb-3 lg:rp-pb-2 rp-leading-tight rp-z-10">
            <span
              className={styles.clip}
              style={{ lineHeight: '1.3' }}
              {...renderHtmlOrText(hero.name)}
            />
          </h1>
          {multiHeroText.length !== 0 &&
            multiHeroText.map(heroText => (
              <p
                key={heroText}
                className={`rspress-home-hero-text rp-mx-auto md:rp-m-0 rp-text-3xl sm:rp-text-5xl md:rp-text-6xl sm:rp-pb-2 rp-font-bold rp-z-10 ${textMaxWidth}`}
                style={{ lineHeight: '1.2' }}
                {...renderHtmlOrText(heroText)}
              ></p>
            ))}

          <p
            className={`rspress-home-hero-tagline rp-whitespace-pre-wrap rp-pt-4 rp-m-auto md:rp-m-0 rp-text-sm sm:rp-tex-xl md:rp-text-[1.5rem] rp-text-text-2 rp-font-medium rp-z-10 ${textMaxWidth}`}
            {...renderHtmlOrText(hero.tagline)}
          ></p>
          {beforeHeroActions}
          {hero.actions?.length ? (
            <div className="rp-grid md:rp-flex md:rp-flex-wrap md:rp-justify-center rp-gap-3 rp-pt-6 sm:rp-pt-8 rp-z-10">
              {hero.actions.map(action => {
                const link = isExternalUrl(action.link)
                  ? action.link
                  : normalizeHrefInRuntime(withBase(action.link, routePath));
                return (
                  <div className="rp-flex rp-flex-shrink-0 rp-p-1" key={link}>
                    <Button
                      type="a"
                      href={link}
                      text={renderHtmlOrText(action.text)}
                      theme={action.theme}
                      className="rp-w-full"
                    />
                  </div>
                );
              })}
            </div>
          ) : null}
          {afterHeroActions}
        </div>

        {hasImage ? (
          <div className="rspress-home-hero-image md:rp-flex md:rp-items-center md:rp-justify-center rp-m-auto rp-order-1 md:rp-order-2 sm:rp-flex md:rp-none lg:rp-flex">
            <img
              src={normalizeImagePath(imageSrc.light)}
              alt={hero.image?.alt}
              srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
              sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
              width={375}
              height={375}
              className="dark:rp-hidden"
            />
            <img
              src={normalizeImagePath(imageSrc.dark)}
              alt={hero.image?.alt}
              srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
              sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
              width={375}
              height={375}
              className="rp-hidden dark:rp-block"
            />
          </div>
        ) : null}
      </div>
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
