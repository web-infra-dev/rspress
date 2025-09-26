export function cls(...args: string[]) {
  return Array.from(args).filter(Boolean).join(' ');
}
