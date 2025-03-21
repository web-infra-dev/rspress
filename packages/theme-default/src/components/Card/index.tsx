interface CardProps {
  /**
   * The title of the card.
   */
  title: React.ReactNode;
  /**
   * The content to display inside the card.
   */
  content?: React.ReactNode;
  /**
   * The icon of the card.
   */
  icon?: React.ReactNode;
  /**
   * The style of the card.
   */
  style?: React.CSSProperties;
}

export function Card({ content, title, icon, style }: CardProps) {
  return (
    <div
      className="rp-border rp-border-gray-400 rp-rounded-lg rp-p-6"
      style={style}
    >
      <p className="rp-flex rp-items-center rp-gap-2 rp-mb-4">
        {icon && <div>{icon}</div>}
        {title && <span className="rp-text-2xl rp-font-bold">{title}</span>}
      </p>
      <div className="rp-text-base rp-overflow-auto">{content}</div>
    </div>
  );
}
