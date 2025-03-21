import ArrowRight from '@theme-assets/arrow-right';
import * as styles from './index.module.scss';

interface LinkCardProps {
  /**
   * The URL of the link.
   */
  href: string;
  /**
   * The title of the link.
   */
  title: string;
  /**
   * The description of the link.
   */
  description?: React.ReactNode;
  /**
   * The style of the link card.
   */
  style?: React.CSSProperties;
}

export function LinkCard(props: LinkCardProps) {
  const { href, title, description, style } = props;

  return (
    <div
      className={`rp-relative rp-border rp-border-gray-400 rp-rounded-lg rp-p-6 rp-flex rp-justify-between rp-items-start hover:rp-border-gray-500 rp-transition-all rp-duration-300 ${styles.linkCard}`}
      style={style}
    >
      <div className="rp-flex rp-flex-col">
        <a
          href={href}
          className={`rp-flex rp-items-center rp-gap-2 rp-mb-4 ${styles.link}`}
        >
          {title && <span className="rp-text-2xl rp-font-bold">{title}</span>}
        </a>
        <span className="rp-text-base rp-overflow-auto">{description}</span>
      </div>
      <ArrowRight />
    </div>
  );
}
