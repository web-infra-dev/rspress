import styles from './V2Banner.module.scss';

export function V2Banner() {
  return (
    <a href="https://v2.rspress.rs" className={styles.banner}>
      <span className={styles.content}>
        <span className={styles.badge}>NEW</span>
        <span>Rspress 2.0 is out! Check out the new documentation</span>
        <span className={styles.arrow}>→</span>
      </span>
    </a>
  );
}
