import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Transform `config.icon` into final url path in the web app
 *
 * @param icon original icon in config
 * @returns final url path in the web app
 */
export function getIconUrlPath(icon: '' | undefined): undefined;
export function getIconUrlPath(icon: string | URL): string;
export function getIconUrlPath(
  icon: string | URL | undefined,
): string | undefined;
export function getIconUrlPath(icon: string | URL | undefined) {
  if (!icon) {
    return undefined;
  }

  icon = icon.toString();

  if (icon.startsWith('file://')) {
    icon = fileURLToPath(icon);
  }

  // data:, http:, https:, etc
  if (!path.isAbsolute(icon)) {
    return icon;
  }

  // https://rsbuild.rs/config/html/favicon#example
  return `/${path.basename(icon)}`;
}
