import { usePage } from './usePage';

export function useLang(): string {
  const { page } = usePage();
  return page.lang || '';
}
