import styles from './index.module.scss';

interface BadgeProps {
  text: string;
  type: 'info' | 'warning' | 'danger';
}

export function Badge(props: BadgeProps) {
  const { text, type = 'info' } = props;
  return (
    <span
      className={`inline-block rounded-full font-medium ${styles.badge} ${styles[type]}`}
    >
      {text}
    </span>
  );
}
