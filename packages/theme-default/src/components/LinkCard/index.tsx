import styles from './index.module.scss';
import ArrowRight from '@theme-assets/arrow-right';

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
  description: string;
  /**
   * The style of the link card.
   */
  style?: React.CSSProperties;
}

export function LinkCard(props: LinkCardProps) {
  const { href, title, description, style } = props;

  return (
    <div
      className="relative border border-gray-400 rounded-lg p-6 flex justify-between items-start hover:border-gray-500 hover:bg-gray-100 transition-all duration-300"
      style={style}
    >
      <div className="flex flex-col">
        <a
          href={href}
          className={`flex items-center gap-2 mb-4 ${styles.link}`}
        >
          {title && <span className="text-2xl font-bold">{title}</span>}
        </a>
        <span className="text-base overflow-auto">{description}</span>
      </div>
      <ArrowRight />
    </div>
  );
}
