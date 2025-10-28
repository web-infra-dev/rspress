import type { Feature } from '@rspress/core';
import { useFrontmatter } from '@rspress/core/runtime';
import type { JSX } from 'react';
import { renderHtmlOrText } from '../../logic/utils';
import { useNavigate } from '../Link/useNavigate';
import './index.scss';

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
  const { icon, title, details, link: rawLink } = feature;

  const link = rawLink;
  const navigate = useNavigate();

  return (
    <div
      key={title}
      className={`rp-home-feature__item ${getGridClass(feature)}`}
    >
      <div className="rp-home-feature__item-wrapper">
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
    </div>
  );
}

export function HomeFeature() {
  const { frontmatter } = useFrontmatter();
  const features = frontmatter?.features;

  return (
    <div className="rp-home-feature">
      {features?.map(feature => {
        return <HomeFeatureItem key={feature.title} feature={feature} />;
      })}
    </div>
  );
}
