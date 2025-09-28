import { ProgressCircle } from './ProgressCircle';
import { useReadPercent } from './useReadPercent';

export function ReadPercent({
  size,
  strokeWidth,
}: {
  size: number;
  strokeWidth: number;
}) {
  const [readPercent] = useReadPercent();
  return (
    <ProgressCircle
      percent={readPercent}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
