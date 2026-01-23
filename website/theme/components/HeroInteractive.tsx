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
            <SunIcon />
          </div>
          <div className={`${styles.navItem} ${styles.icon}`}>
            <GithubIcon />
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
              <div className={styles.cardHeader}>
                <span>index.mdx</span>
                <span className={styles.badge}>Markdown</span>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <span className={styles.keyword}>import</span>{' '}
                  <span>{'{ CustomComponent }'}</span>{' '}
                  <span className={styles.keyword}>from</span>{' '}
                  <span className={styles.string}>'./custom'</span>;
                </div>
                <div>
                  <span className={styles.punctuation}># Hello world</span>
                </div>
                <div>
                  <span className={styles.punctuation}>&lt;</span>
                  <span className={styles.component}>CustomComponent</span>{' '}
                  <span className={styles.punctuation}>/&gt;</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span>rspress.config.ts</span>
                <span className={styles.badge}>Logo</span>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <span className={styles.keyword}>import</span>{' '}
                  <span>{'{ defineConfig }'}</span>{' '}
                  <span className={styles.keyword}>from</span>{' '}
                  <span className={styles.string}>'.rspress/config'</span>;
                </div>
                <div>
                  <span className={styles.keyword}>export</span>{' '}
                  <span className={styles.keyword}>default</span>{' '}
                  <span className={styles.function}>defineConfig</span>
                  <span className={styles.punctuation}>({' {'}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 8,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--rp-c-brand)',
                    }}
                  />
                  <div
                    style={{
                      width: 24,
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--rp-c-brand-light)',
                    }}
                  />
                  <div
                    style={{
                      width: 32,
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--rp-c-brand-dark)',
                    }}
                  />
                </div>
                <div className={styles.punctuation}>{'}'});</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.00098 15.8484L5.7752 17.0742C5.5502 17.2992 5.5502 17.6672 5.7752 17.8922C6.0002 18.1172 6.36816 18.1172 6.59316 17.8922L7.81895 16.6664C8.04395 16.4414 8.04395 16.0734 7.81895 15.8484C7.59395 15.6234 7.22598 15.6234 7.00098 15.8484ZM6.64941 7.11328C6.87676 7.34062 7.24707 7.34062 7.47441 7.11328C7.70176 6.88594 7.70176 6.51562 7.47441 6.28828L6.23691 5.05078C6.00957 4.82344 5.63926 4.82344 5.41191 5.05078C5.18457 5.27812 5.18457 5.64844 5.41191 5.87578L6.64941 7.11328ZM5.01113 11.0695H3.26035C2.93691 11.0695 2.67676 11.3297 2.67676 11.6531C2.67676 11.9766 2.93926 12.2367 3.26035 12.2367H5.01113C5.33457 12.2367 5.59473 11.9766 5.59473 11.6531C5.59473 11.332 5.33223 11.0695 5.01113 11.0695ZM12.0143 5.23359C12.3377 5.23359 12.5979 4.97344 12.5979 4.65V2.89922C12.5979 2.57578 12.3377 2.31562 12.0143 2.31562C11.6908 2.31562 11.4307 2.57578 11.4307 2.89922V4.65C11.4307 4.97344 11.6932 5.23359 12.0143 5.23359ZM17.6299 6.85547L18.8557 5.62969C19.0807 5.40469 19.0807 5.03672 18.8557 4.81172C18.6307 4.58672 18.2627 4.58672 18.0377 4.81172L16.8119 6.0375C16.5869 6.2625 16.5869 6.63047 16.8119 6.85547C17.0369 7.08281 17.4049 7.08281 17.6299 6.85547ZM20.7682 11.0695H19.0174C18.6939 11.0695 18.4338 11.3297 18.4338 11.6531C18.4338 11.9766 18.6939 12.2367 19.0174 12.2367H20.7682C21.0916 12.2367 21.3518 11.9766 21.3518 11.6531C21.3518 11.332 21.0916 11.0695 20.7682 11.0695ZM17.3791 16.193C17.1518 15.9656 16.7814 15.9656 16.5541 16.193C16.3268 16.4203 16.3268 16.7906 16.5541 17.018L17.7916 18.2555C18.0189 18.4828 18.3893 18.4828 18.6166 18.2555C18.8439 18.0281 18.8439 17.6578 18.6166 17.4305L17.3791 16.193ZM12.0143 6.39844C9.11035 6.39844 6.75723 8.75156 6.75723 11.6555C6.75723 14.5594 9.11035 16.9125 12.0143 16.9125C14.9182 16.9125 17.2713 14.5594 17.2713 11.6555C17.2713 8.75156 14.9182 6.39844 12.0143 6.39844ZM12.0143 18.0727C11.6908 18.0727 11.4307 18.3328 11.4307 18.6562V20.407C11.4307 20.7305 11.6908 20.9906 12.0143 20.9906C12.3377 20.9906 12.5979 20.7305 12.5979 20.407V18.6562C12.5979 18.3352 12.3377 18.0727 12.0143 18.0727Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>GitHub</title>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}
