import { useLang } from '@rspress/runtime';
import type { NavItem } from '@rspress/shared';
import { nav } from 'virtual-runtime-config';
export function useNav(): NavItem[] {
  if (!nav) {
    return [];
  }
  if (Array.isArray(nav)) {
    return nav;
  }
  const lang = useLang();

  return nav[lang];
}
