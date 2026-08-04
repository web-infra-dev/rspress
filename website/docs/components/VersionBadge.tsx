import { useLang } from '@rspress/core/runtime';
import { Link } from '@rspress/core/theme';
import styles from './VersionBadge.module.scss';

export interface VersionBadgeProps {
  version: string;
}

export function VersionBadge({ version }: VersionBadgeProps) {
  const lang = useLang();
  const normalizedVersion = version.trim().replace(/^v/i, '');

  return (
    <div className={`${styles.wrapper} rp-not-doc`}>
      <span className={styles.badge}>
        <Link
          href={`https://github.com/web-infra-dev/rspress/releases/tag/v${normalizedVersion}`}
        >
          {lang === 'zh' ? '新增于' : 'Added in'} v{normalizedVersion}
        </Link>
      </span>
    </div>
  );
}
