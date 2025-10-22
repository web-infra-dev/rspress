import { usePage } from './usePage';

export function useVersion(): string {
  const { page } = usePage();
  return page.version || '';
}
