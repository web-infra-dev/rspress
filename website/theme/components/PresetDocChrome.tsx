import { Outline as OriginalOutline } from '@rspress/core/theme-original';
import { useThemePreset } from '../presets/ThemePresetProvider';

// Add wrappers here for future supportedPreviewExports such as DocFooter.
// Keep website Search and runtime providers outside this override surface.
export function PresetOutline() {
  const { activeModule } = useThemePreset();
  const Outline = activeModule?.Outline ?? OriginalOutline;
  return <Outline />;
}
