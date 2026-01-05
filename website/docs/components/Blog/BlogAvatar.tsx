import styles from './BlogAvatar.module.css';

// cspell:disable
const AUTHORS = {
  sooniter: {
    name: 'Sooniter',
    title: 'Rspress V2 maintainer',
    github: 'https://github.com/sooniter',
    avatar: 'https://github.com/sooniter.png',
    x: 'https://x.com/Soon_Iter',
  },
} as const;
// cspell:enable

export function BlogAvatar({ author }: { author: string }) {
  const AUTHOR = AUTHORS[author as keyof typeof AUTHORS];
  if (!AUTHOR) {
    return null;
  }
  const { name, title, github, avatar, x } = AUTHOR || {};
  return (
    <div className={styles.avatarContainer}>
      <img src={avatar} alt={name} className={styles.avatar} />
      <div className={styles.info}>
        <div className={styles.name}>{name}</div>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.links}>
          {github && (
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label={`${name}'s GitHub`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill="currentColor"
                  d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                />
              </svg>
            </a>
          )}
          {x && (
            <a
              href={x}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              aria-label={`${name}'s X profile`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fill="currentColor"
                  d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584l-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
