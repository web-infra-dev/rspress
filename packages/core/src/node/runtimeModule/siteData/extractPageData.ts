import path from 'node:path';
import fs from '@rspress/shared/fs-extra';
import { htmlToText } from 'html-to-text';
import { compile } from '@rspress/mdx-rs';
import { loadFrontMatter } from '@rspress/shared/node-utils';
import {
  type Header,
  MDX_REGEXP,
  type ReplaceRule,
  type PageIndexInfo,
} from '@rspress/shared';
import { flattenMdxContent } from '@/node/utils';
import { importStatementRegex } from '@/node/constants';
import type { RouteService } from '@/node/route/RouteService';
import { applyReplaceRules } from '@/node/utils/applyReplaceRules';

export async function extractPageData(
  replaceRules: ReplaceRule[],
  alias: Record<string, string | string[]>,
  domain: string,
  root: string,
  routeService: RouteService,
  highlighterLangs: Set<string>,
): Promise<(PageIndexInfo | null)[]> {
  return Promise.all(
    routeService.getRoutes().map(async (route, index) => {
      const defaultIndexInfo: PageIndexInfo = {
        id: index,
        title: '',
        content: '',
        routePath: route.routePath,
        lang: route.lang,
        toc: [],
        domain,
        frontmatter: {},
        version: route.version,
        _filepath: route.absolutePath,
        _relativePath: path.relative(root, route.absolutePath),
      };
      if (!MDX_REGEXP.test(route.absolutePath)) {
        return defaultIndexInfo;
      }
      let content: string = await fs.readFile(route.absolutePath, 'utf8');
      const { frontmatter, content: strippedFrontMatter } = loadFrontMatter(
        content,
        route.absolutePath,
        root,
      );

      // 1. Replace rules for frontmatter & content
      Object.keys(frontmatter).forEach(key => {
        if (typeof frontmatter[key] === 'string') {
          frontmatter[key] = applyReplaceRules(frontmatter[key], replaceRules);
        }
      });

      const { flattenContent } = await flattenMdxContent(
        applyReplaceRules(strippedFrontMatter, replaceRules),
        route.absolutePath,
        alias,
      );

      content = flattenContent.replace(importStatementRegex, '');

      const {
        html,
        title,
        toc: rawToc,
        languages,
      } = await compile({
        value: content,
        filepath: route.absolutePath,
        development: process.env.NODE_ENV !== 'production',
        root,
      });

      if (!title?.length && !frontmatter && !frontmatter.title?.length) {
        return null;
      }

      content = htmlToText(String(html), {
        wordwrap: 80,
        selectors: [
          {
            selector: 'a',
            options: {
              ignoreHref: true,
            },
          },
          {
            selector: 'img',
            format: 'skip',
          },
          {
            // Skip code blocks
            selector: 'pre > code',
            format: 'skip',
          },
          ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(tag => ({
            selector: tag,
            options: {
              uppercase: false,
            },
          })),
        ],
        tables: true,
        longWordSplit: {
          forceWrapOnLimit: true,
        },
      });
      if (content.startsWith(title)) {
        // Remove the title from the content
        content = content.slice(title.length);
      }

      languages.forEach(lang => highlighterLangs.add(lang));
      const toc: Header[] = rawToc.map(item => {
        // If the item.id ends with '-number', we take the number
        const match = item.id.match(/-(\d+)$/);
        let position = -1;
        if (match) {
          for (let i = 0; i < Number(match[1]); i++) {
            position = content.indexOf(`\n${item.text}#\n\n`, position + 1);
          }
        }
        return {
          ...item,
          charIndex: content.indexOf(`\n${item.text}#\n\n`, position + 1),
        };
      });

      return {
        ...defaultIndexInfo,
        title: frontmatter.title || title,
        toc,
        // Stripped frontmatter content
        content,
        frontmatter: {
          ...frontmatter,
          __content: undefined,
        },
      };
    }),
  );
}
