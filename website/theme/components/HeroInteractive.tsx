import styles from './HeroInteractive.module.scss';

const PATHS = [
  { label: '起', value: '01' },
  { label: '承', value: '02' },
  { label: '转', value: '03' },
  { label: '合', value: '04' },
];

export function HeroInteractive() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.sun} />
      <div className={styles.mist} />
      <div className={styles.mountainBack} />
      <div className={styles.mountainFront} />

      <div className={styles.wheel}>
        <div className={styles.wheelOuter} />
        <div className={styles.wheelMiddle} />
        <div className={styles.wheelInner}>
          <img
            src="https://assets.rspack.rs/rspress/rspress-logo.svg"
            alt=""
          />
        </div>
        <span className={styles.runeOne}>疾</span>
        <span className={styles.runeTwo}>构</span>
        <span className={styles.runeThree}>文</span>
        <span className={styles.runeFour}>道</span>
      </div>

      <div className={styles.staff} />
      <div className={styles.seal}>
        <span>如</span>
        <span>意</span>
      </div>

      <div className={styles.chapter}>
        <span className={styles.chapterEyebrow}>天命 · 文牒</span>
        <strong>一念成章</strong>
        <i />
        <p>以 Rust 为锋，以 Markdown 载道</p>
      </div>

      <div className={styles.paths}>
        {PATHS.map(path => (
          <div className={styles.path} key={path.value}>
            <span>{path.value}</span>
            <b>{path.label}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
