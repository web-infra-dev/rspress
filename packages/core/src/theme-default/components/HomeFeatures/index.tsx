import { FrontMatterMeta } from '@rspress/shared';
import styles from './index.module.scss';

const PRESET_COUNT = [2, 3, 4];

const getGridClass = (count?: number): string => {
  if (!count) {
    return '';
  } else if (PRESET_COUNT.includes(count)) {
    return `grid-${12 / count}`;
  } else if (count % 3 === 0) {
    return 'grid-4';
  } else if (count % 2 === 0) {
    return 'grid-6';
  }
  return '';
};

export function HomeFeature({ frontmatter }: { frontmatter: FrontMatterMeta }) {
  const features = frontmatter?.features;
  const gridClass = getGridClass(features?.length);

  return (
    <div className="overflow-hidden m-auto flex flex-wrap justify-between max-w-6xl">
      {features?.map(feature => {
        const { icon, title, details, link } = feature;
        return (
          <div
            key={title}
            className={`${
              gridClass ? styles[gridClass] : 'w-full'
            } rounded hover:var(--rp-c-brand)`}
          >
            <div className="h-full p-2">
              <article
                key={title}
                className={`${styles.featureCard} h-full p-8 rounded-4xl border-transparent`}
                style={{
                  cursor: link ? 'pointer' : 'auto',
                }}
                onClick={() => {
                  if (link) {
                    window.location.href = link;
                  }
                }}
              >
                <div className="flex-center">
                  <div className="rspress-home-feature-icon w-12 h-12 text-3xl text-center">
                    {icon}
                  </div>
                </div>
                <h2 className="rspress-home-feature-title font-bold text-center">
                  {title}
                </h2>
                <p className="rspress-home-feature-detail leading-6 pt-2 text-sm text-text-2 font-medium">
                  {details}
                </p>
              </article>
            </div>
          </div>
        );
      })}
    </div>
  );
}
