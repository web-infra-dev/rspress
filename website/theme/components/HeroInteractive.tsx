import {
  CodeBlock,
  IconGithub,
  IconMoon,
  IconSearch,
  IconSun,
} from '@rspress/core/theme';
import styles from './HeroInteractive.module.scss';

export function HeroInteractive() {
  return (
    <div className={styles.wrapper}>
      <img
        className={styles.logo}
        src="https://assets.rspack.rs/rspress/rspress-logo.svg"
        alt="Rspress Logo"
      />
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />
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
            <div className={styles.fakeSearch}>
              <IconSearch />
            </div>
            <div className={styles.navItem}>English</div>
            <div className={`${styles.navItem} ${styles.icon}`}>
              <div className={styles.sun}>
                <IconSun />
              </div>
              <div className={styles.moon}>
                <IconMoon />
              </div>
            </div>
            <div className={`${styles.navItem} ${styles.icon}`}>
              <IconGithub />
            </div>
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.sidebar}>
            <div style={{ width: '40%' }} className={styles.sidebarHeader} />
            <div className={`${styles.sidebarItem} ${styles.active}`}>
              <div style={{ width: '70%' }} />
            </div>
            <div className={styles.sidebarItem}>
              <div style={{ width: '50%' }} />
            </div>
            <div
              style={{ width: '60%', marginTop: 12 }}
              className={styles.sidebarHeader}
            />
            <div className={styles.sidebarItem}>
              <div style={{ width: '40%' }} />
            </div>
            <div className={styles.sidebarItem}>
              <div style={{ width: '60%' }} />
            </div>
            <div className={styles.sidebarItem}>
              <div style={{ width: '50%' }} />
            </div>
          </div>
          <div className={styles.main}>
            <div className={styles.title}>Hello Rspress</div>
            <div className={styles.skeletonText} />
            <div className={styles.skeletonText} />

            <div className={styles.cards}>
              <div className={styles.card}>
                <CodeBlock title="index.mdx" lang="Markdown">
                  <div className={styles.codeContent}>
                    <div className="line">
                      <span className={styles.text0}># Hello Rspress</span>
                    </div>
                    <br />
                    <div className="line">
                      <span className={styles.punctuation}>```</span>
                      <span className={styles.function}>ts</span>{' '}
                      <span>title</span>
                      <span className={styles.punctuation}>=</span>
                      <span className={styles.string}>"index.ts"</span>
                    </div>
                    <div className="line">
                      <span className={styles.constant}>console</span>
                      <span className={styles.punctuation}>.</span>
                      <span className={styles.function}>log</span>
                      <span className={styles.punctuation}>(</span>
                      <span className={styles.string}>'Hello Rspress'</span>
                      <span className={styles.punctuation}>);</span>
                    </div>
                    <div className="line">
                      <span className={styles.punctuation}>```</span>
                    </div>
                  </div>
                </CodeBlock>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
