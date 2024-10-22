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
    <div className="border border-gray-400 rounded-lg p-6" style={style}>
      <p className="flex items-center gap-2 mb-4">
        {icon && <div>{icon}</div>}
        {title && <span className="text-2xl font-bold">{title}</span>}
      </p>
      <div className="text-base overflow-auto">{content}</div>
    </div>
  );
}
