import { Outline as OriginalOutline } from '@rspress/core/theme-original';
import { useCssEntry } from '../../docs/components/CssModificationContext';
import {
  Outline as RuixenOutline,
  RuixenBreadcrumb,
} from '../../docs/public/themes/ruixen';

export function PresetBreadcrumb() {
  const [css] = useCssEntry('rspress-theme-preset', '');
  return css ? <RuixenBreadcrumb /> : null;
}

export function PresetOutline() {
  const [css] = useCssEntry('rspress-theme-preset', '');
  return css ? <RuixenOutline /> : <OriginalOutline />;
}
