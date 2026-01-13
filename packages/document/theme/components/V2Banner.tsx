import { useLang } from 'rspress/runtime';
import styles from './V2Banner.module.scss';

const messages = {
  en: 'Rspress 2.0 is out! Check out the new documentation',
  zh: 'Rspress 2.0 已发布！查看新版文档',
};

export function V2Banner() {
  const lang = useLang();
  const message = lang === 'zh' ? messages.zh : messages.en;

  return (
    <a href="https://v2.rspress.rs" className={styles.banner}>
      <span className={styles.content}>
        <span className={styles.badge}>NEW</span>
        <span className={styles.message}>{message}</span>
        <span className={styles.arrow}>→</span>
      </span>
    </a>
  );
}
