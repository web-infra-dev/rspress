import type { SiteData } from '@rspress/shared';

export function serializeSiteData(siteData: Omit<SiteData, 'root' | 'pages'>) {
  const { logo, ...data } = siteData;
  const imports: string[] = [];
  const serializeLogo = (source: string): string => {
    if (!source.startsWith('file://')) {
      return JSON.stringify(source);
    }

    // Let the bundler emit and watch local logos, including files outside public/.
    // Keep the file URL encoded so spaces and reserved characters stay intact.
    const url = new URL(source);
    url.search = '?url';
    const name = `logo${imports.length}`;
    imports.push(`import ${name} from ${JSON.stringify(url.href)};`);
    return name;
  };

  const logoExpression =
    typeof logo === 'string'
      ? serializeLogo(logo)
      : `{ dark: ${serializeLogo(logo.dark)}, light: ${serializeLogo(logo.light)} }`;

  return `${imports.join('\n')}
export default { ...${JSON.stringify(data, null, 2)}, logo: ${logoExpression} };`;
}
