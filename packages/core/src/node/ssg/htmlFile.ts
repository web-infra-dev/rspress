import { isAbsolute, relative, resolve } from 'node:path';

export const routePath2HtmlFileName = (routePath: string) => {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.html`;
  } else {
    fileName = `${routePath}.html`;
  }

  return fileName.replace(/^\/+/, '');
};

export function resolveHtmlFilePath(distPath: string, routePath: string) {
  const distPathAbsolute = resolve(distPath);
  const fileAbsolutePath = resolve(
    distPathAbsolute,
    routePath2HtmlFileName(routePath),
  );
  const relativePath = relative(distPathAbsolute, fileAbsolutePath);

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      `SSG route path "${routePath}" resolves outside of the output directory.`,
    );
  }

  return fileAbsolutePath;
}
