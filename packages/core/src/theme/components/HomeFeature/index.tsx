import type { Feature } from '@rspress/core';
import { useFrontmatter } from '@rspress/core/runtime';
import { renderHtmlOrText, useLinkNavigate } from '@theme';
import type { JSX } from 'react';
import './index.scss';
import { useCardAnimation } from './useCardAnimation';

const getGridClass = (feature: Feature): string => {
  const { span } = feature;
  switch (span) {
    case 2:
      return 'rp-home-feature__item--span-2';
    case 3:
      return 'rp-home-feature__item--span-3';
    case 4:
      return 'rp-home-feature__item--span-4';
    case 6:
      return 'rp-home-feature__item--span-6';
    case undefined:
      return 'rp-home-feature__item--span-4';
    default:
      return '';
  }
};

function HomeFeatureItem({ feature }: { feature: Feature }): JSX.Element {
  const { icon, title, details, link } = feature;

  const { innerProps, outerProps, outerRef, shineDom } = useCardAnimation();
  const navigate = useLinkNavigate();

  return (
    <div
      key={title}
      {...outerProps}
      className={`rp-home-feature__item ${getGridClass(feature)}`}
      ref={outerRef}
    >
      <div className="rp-home-feature__item-wrapper" {...innerProps}>
        <article
          key={title}
          className={`rp-home-feature__card ${link ? 'rp-home-feature__card--clickable' : ''}`}
          onClick={() => {
            if (link) {
              navigate(link);
            }
          }}
        >
          <div className="rp-home-feature__title-wrapper">
            {icon ? (
              <div
                className="rp-home-feature__icon"
                {...renderHtmlOrText(icon)}
              ></div>
            ) : null}

            <h2 className="rp-home-feature__title">{title}</h2>
          </div>
          <p
            className="rp-home-feature__detail"
            {...renderHtmlOrText(details)}
          ></p>
        </article>
      </div>
      {shineDom}
    </div>
  );
}

export function HomeFeature({
  features: featuresProp,
}: {
  features?: Feature[];
}): JSX.Element {
  const { frontmatter } = useFrontmatter();
  const features = featuresProp ?? frontmatter?.features;

  return (
    <div className="rp-home-feature">
      {features?.map(feature => {
        return <HomeFeatureItem key={feature.title} feature={feature} />;
      })}
    </div>
  );
}
