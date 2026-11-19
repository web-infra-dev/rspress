import type { ReactNode } from 'react';
import { useThemePreset } from '../../theme/presets/ThemePresetProvider';

/** Keep a preset's documentation and its outline headings tied to the active preview. */
export function ThemePresetContent({
  presetId,
  children,
}: {
  presetId: string;
  children: ReactNode;
}) {
  const { activePreset } = useThemePreset();
  return activePreset.id === presetId ? <>{children}</> : null;
}
