interface CircleProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  backgroundColor?: string;
  className?: string;
}

export const ProgressCircle: React.FC<CircleProgressProps> = ({
  percent,
  size = 100,
  strokeWidth = 8,
  strokeColor = 'currentColor',
  backgroundColor = 'hsl(var(--background))',
  className,
}) => {
  const normalizedPercent = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercent / 100) * circumference;

  return (
    <svg width={size} height={size} className={className}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeLinecap="round"
        fill="none"
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeLinecap="round"
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        // className="duration-75"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
    </svg>
  );
};
