import { CodeBlock, IconGithub, IconSun } from '@rspress/core/theme';
import styles from './HeroInteractive.module.scss';

export function HeroInteractive() {
  return (
    <div className={styles.container}>
      <div className={styles.nav}>
        <div className={styles.navLeft}>
          <img
            src="https://assets.rspack.rs/rspress/rspress-logo.svg"
            alt="Rspress Logo"
          />
          <span>Rspress</span>
        </div>
        <div className={styles.navRight}>
          <div className={styles.fakeSearch} />
          <div className={styles.navItem}>English</div>
          <div className={`${styles.navItem} ${styles.icon}`}>
            <IconSun />
          </div>
          <div className={`${styles.navItem} ${styles.icon}`}>
            <IconGithub />
          </div>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={`${styles.sidebarItem} ${styles.active}`} />
          <div className={styles.sidebarItem} />
          <div className={styles.sidebarItem} />
          <div className={styles.sidebarItem} />
          <div className={styles.sidebarItem} />
          <div className={styles.sidebarItem} />
        </div>
        <div className={styles.main}>
          <div className={styles.title}>Hello world</div>
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} />

          <div className={styles.cards}>
            <div className={styles.card}>
              <CodeBlock title="index.mdx" lang="Markdown">
                <div className={styles.codeContent}>
                  <div className="line">
                    <span className={styles.keyword}>import</span>{' '}
                    <span>{'{ CustomComponent }'}</span>{' '}
                    <span className={styles.keyword}>from</span>{' '}
                    <span className={styles.string}>'./custom'</span>;
                  </div>
                  <div className="line">
                    <span className={styles.punctuation}># Hello world</span>
                  </div>
                  <div className="line">
                    <span className={styles.punctuation}>&lt;</span>
                    <span className={styles.component}>CustomComponent</span>{' '}
                    <span className={styles.punctuation}>/&gt;</span>
                  </div>
                </div>
              </CodeBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
