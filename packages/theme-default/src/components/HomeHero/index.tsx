import { Button } from '@theme';
import { isExternalUrl, withBase } from '@rspress/shared';
import { normalizeHrefInRuntime, normalizeImagePath } from '@rspress/runtime';
import { renderHtmlOrText } from '../../logic';
import type { FrontMatterMeta } from '@rspress/shared';

import styles from './index.module.scss';

const DEFAULT_HERO: FrontMatterMeta['hero'] = {
  name: 'modern',
  text: 'modern ssg',
  tagline: 'modern ssg',
  actions: [],
  image: undefined,
};

export function HomeHero({
  frontmatter,
  routePath,
}: {
  frontmatter: FrontMatterMeta;
  routePath: string;
}) {
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
    <div className="m-auto pt-0 px-6 pb-12 sm:pt-10 sm:px-16 md:pt-16 md:px-16 md:pb-16 relative">
      <div
        className={styles.mask}
        style={{
          left: hasImage ? '75%' : '50%',
        }}
      ></div>
      <div className="m-auto flex flex-col md:flex-row max-w-6xl min-h-[50vh] mt-12 sm:mt-0">
        <div className="flex flex-col justify-center items-center text-center max-w-xl sm:max-w-4xl m-auto order-2 md:order-1">
          <h1 className="font-bold text-3xl pb-2 sm:text-6xl md:text-7xl m-auto sm:m-4 md:m-0 md:pb-3 lg:pb-2 leading-tight z-10">
            <span className={styles.clip} style={{ lineHeight: '1.3' }}>
              {renderHtmlOrText(hero.name)}
            </span>
          </h1>
          {multiHeroText.length !== 0 &&
            multiHeroText.map(heroText => (
              <p
                key={heroText}
                className={`rspress-home-hero-text mx-auto md:m-0 text-3xl sm:text-5xl md:text-6xl sm:pb-2 font-bold z-10 ${textMaxWidth}`}
                style={{ lineHeight: '1.2' }}
              >
                {renderHtmlOrText(heroText)}
              </p>
            ))}

          <p
            className={`rspress-home-hero-tagline whitespace-pre-wrap pt-4 m-auto md:m-0 text-sm sm:tex-xl md:text-[1.5rem] text-text-2 font-medium z-10 ${textMaxWidth}`}
          >
            {renderHtmlOrText(hero.tagline)}
          </p>
          {hero.actions?.length && (
            <div className="grid md:flex md:flex-wrap md:justify-center gap-3 m--1.5 pt-6 sm:pt-8 z-10">
              {hero.actions.map(action => {
                const link = isExternalUrl(action.link)
                  ? action.link
                  : normalizeHrefInRuntime(withBase(action.link, routePath));
                return (
                  <div className="flex flex-shrink-0 p-1" key={link}>
                    <Button
                      type="a"
                      href={link}
                      text={renderHtmlOrText(action.text)}
                      theme={action.theme}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasImage ? (
          <div className="rspress-home-hero-image md:flex-center m-auto order-1 md:order-2 sm:flex md:none lg:flex">
            <img
              src={normalizeImagePath(imageSrc.light)}
              alt={hero.image?.alt}
              srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
              sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
              width={375}
              height={375}
              className="dark:hidden"
            />
            <img
              src={normalizeImagePath(imageSrc.dark)}
              alt={hero.image?.alt}
              srcSet={normalizeSrcsetAndSizes(hero.image?.srcset)}
              sizes={normalizeSrcsetAndSizes(hero.image?.sizes)}
              width={375}
              height={375}
              className="hidden dark:block"
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
