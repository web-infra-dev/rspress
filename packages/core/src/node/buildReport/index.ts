import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { PerformanceConfig } from '@rsbuild/core';
import type { RouteMeta } from '@rspress/shared';
import { resolveHtmlFilePath, routePath2HtmlFileName } from '../ssg/htmlFile';
import { formatBuildReport } from './format';

type PrintFileSize = NonNullable<PerformanceConfig['printFileSize']>;
type ReportOptions = Exclude<PrintFileSize, boolean>;

interface ReportEnvironment {
  output: { distPath: { root: string } };
  performance: { printFileSize: PrintFileSize };
}

function getReportOptions(environment?: ReportEnvironment) {
  const options = environment?.performance.printFileSize;
  // Keep Rsbuild's detailed, custom and diff reporters when requested.
  if (
    !options ||
    options === true ||
    options.detail !== false ||
    options.total === false ||
    typeof options.total === 'function' ||
    options.diff
  ) {
    return;
  }
  return options;
}

async function getPageSize(
  rootPath: string,
  environment: ReportEnvironment,
  options: ReportOptions,
  routePath: string,
  markdown = false,
) {
  const distPath = path.resolve(rootPath, environment.output.distPath.root);
  let filePath = resolveHtmlFilePath(distPath, routePath);
  let name = routePath2HtmlFileName(routePath);
  if (markdown) {
    filePath = filePath.replace(/\.html$/, '.md');
    name = name.replace(/\.html$/, '.md');
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) {
      return;
    }
    const asset = { name, size: file.size };
    if (
      options.exclude?.(asset) ||
      (options.include && !options.include(asset))
    ) {
      return;
    }
    return file.size;
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code === 'ENOENT' ||
      (error as NodeJS.ErrnoException).code === 'ENOTDIR'
    ) {
      return;
    }
    throw error;
  }
}

export async function createBuildReport({
  rootPath,
  environments,
  routes,
}: {
  rootPath: string;
  environments: Record<string, ReportEnvironment>;
  routes: Pick<RouteMeta, 'routePath'>[];
}): Promise<string> {
  // CSR emits HTML in web; SSG emits HTML in node. Worker rendering writes
  // directly to disk, so compilation stats cannot provide all page sizes.
  const htmlEnvironment = environments.node ?? environments.web;
  const markdownEnvironment = environments.node_md;
  const htmlOptions = getReportOptions(htmlEnvironment);
  const markdownOptions = getReportOptions(markdownEnvironment);
  if (!htmlOptions && !markdownOptions) {
    return '';
  }

  const routePaths = new Set(routes.map(route => route.routePath));
  // The fallback page is added by the renderer rather than RouteService.
  routePaths.add('/404');
  const pages = await Promise.all(
    [...routePaths].map(async routePath => {
      const [html, markdown] = await Promise.all([
        htmlOptions && htmlEnvironment
          ? getPageSize(rootPath, htmlEnvironment, htmlOptions, routePath)
          : undefined,
        markdownOptions && markdownEnvironment
          ? getPageSize(
              rootPath,
              markdownEnvironment,
              markdownOptions,
              routePath,
              true,
            )
          : undefined,
      ]);
      return { routePath, html, markdown };
    }),
  );

  return formatBuildReport(
    pages.filter(
      page => page.html !== undefined || page.markdown !== undefined,
    ),
    { html: Boolean(htmlOptions), markdown: Boolean(markdownOptions) },
  );
}
