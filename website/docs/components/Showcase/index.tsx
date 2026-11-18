import { useHead, useLang } from '@rspress/core/runtime';
import styles from './index.module.scss';
import { showcaseGroups } from './sites';

export function Showcase() {
  const isZh = useLang() === 'zh';

  useHead({
    title: 'Showcase - Rspress',
    meta: [{ property: 'og:title', content: 'Showcase - Rspress' }],
  });

  return (
    <main className={styles.showcase}>
      <header className={styles.header}>
        <div>
          <h1>Showcase</h1>
          <p>
            {isZh
              ? '探索使用 Rspress 构建的网站。'
              : 'Discover websites built with Rspress.'}
          </p>
        </div>
        <p className={styles.contribute}>
          {isZh ? '也在使用 Rspress？' : 'Using Rspress? '}
          <a
            href="https://github.com/web-infra-dev/rspress/discussions/607"
            target="_blank"
            rel="noopener noreferrer"
          >
            {isZh ? '分享你的网站' : 'Share your site'}
          </a>
          {isZh ? '。' : '.'}
        </p>
      </header>
      {showcaseGroups.map(group => (
        <ul key={group.id} className={styles.gallery}>
          {group.sites.map(site => (
            <li key={site.url} className={styles.card}>
              <a href={site.url} target="_blank" rel="noopener noreferrer">
                <h2>
                  {site.title}
                  <span aria-hidden="true">↗</span>
                </h2>
                <img
                  src={site.image}
                  alt={
                    isZh ? `${site.title} 网站截图` : `${site.title} screenshot`
                  }
                  width={site.width}
                  height={site.height}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            </li>
          ))}
        </ul>
      ))}
    </main>
  );
}
