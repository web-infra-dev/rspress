import clsx from 'clsx';
import type React from 'react';
import './index.scss';

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
  strokeColor = 'var(--rp-c-brand)',
  backgroundColor = 'var(--rp-c-divider-light)',
  className,
}) => {
  const normalizedPercent = Math.min(100, Math.max(0, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercent / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={clsx('rp-progress-circle', className)}
    >
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
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s' }}
      />
    </svg>
  );
};
