import { Outline as OriginalOutline } from '@rspress/core/theme-original';
import { useThemePreset } from '../presets/ThemePresetProvider';

export function PresetBreadcrumb() {
  const { activePreset } = useThemePreset();
  const Breadcrumb = activePreset.components?.Breadcrumb;
  return Breadcrumb ? <Breadcrumb /> : null;
}

export function PresetOutline() {
  const { activePreset } = useThemePreset();
  const Outline = activePreset.components?.Outline ?? OriginalOutline;
  return <Outline />;
}
