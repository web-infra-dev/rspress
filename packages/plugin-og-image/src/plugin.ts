import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import type { PageIndexInfo, RspressPlugin } from '@rspress/core';
import { generateOgImage } from './generator';
import type { OgImageTemplateData, PluginOgImageOptions } from './types';

interface PageOgImageInfo {
  routePath: string;
  imagePath: string;
  imageUrl: string;
  templateData: OgImageTemplateData;
}

export function pluginOgImage(options: PluginOgImageOptions): RspressPlugin {
  const { siteUrl, ogImage = {} } = options;
  const { filter = () => true } = ogImage;

  // Store page info for image generation
  const pageInfoMap = new Map<string, PageOgImageInfo>();

  return {
    name: '@rspress/plugin-og-image',

    config(config) {
      // Extend config.head to add og:image meta tags
      const originalHead = config.head || [];
      config.head = [
        ...originalHead,
        route => {
          const pageInfo = pageInfoMap.get(route.routePath);
          if (pageInfo) {
            return [
              'meta',
              {
                property: 'og:image',
                content: pageInfo.imageUrl,
              },
            ] as [string, Record<string, string>];
          }
          return undefined;
        },
      ];
      return config;
    },

    async extendPageData(pageData: PageIndexInfo, isProd: boolean) {
      if (!isProd || !filter(pageData)) {
        return;
      }

      const { routePath, title, frontmatter } = pageData;

      // Get description from frontmatter or default
      const description = frontmatter?.description as string | undefined;

      // Generate OG image path based on route
      // Example: /guide/getting-started -> /og/guide/getting-started.png
      const cleanPath = routePath.replace(/^\//, '').replace(/\/$/, '');
      const imagePath = cleanPath ? `og/${cleanPath}.png` : 'og/index.png';
      const imageUrl = `${siteUrl.replace(/\/$/, '')}/${imagePath}`;

      // Store template data
      const templateData: OgImageTemplateData = {
        title: title || 'Untitled',
        description,
        siteName: frontmatter?.siteName as string | undefined,
        logo: frontmatter?.logo as string | undefined,
        backgroundColor: frontmatter?.ogBackgroundColor as string | undefined,
        textColor: frontmatter?.ogTextColor as string | undefined,
      };

      pageInfoMap.set(routePath, {
        routePath,
        imagePath,
        imageUrl,
        templateData,
      });
    },

    async afterBuild(config, isProd) {
      if (!isProd || pageInfoMap.size === 0) {
        return;
      }

      // Get output directory
      const distPathRoot =
        typeof config.builderConfig?.output?.distPath === 'string'
          ? config.builderConfig?.output?.distPath
          : config.builderConfig?.output?.distPath?.root;
      const configPath = config.outDir || distPathRoot;
      const outputDir = isAbsolute(configPath || '')
        ? configPath
        : `./${configPath || 'doc_build'}`;

      // Generate all OG images
      console.log(`Generating ${pageInfoMap.size} OG images...`);

      for (const pageInfo of pageInfoMap.values()) {
        try {
          // Generate the image
          const imageBuffer = await generateOgImage(
            pageInfo.templateData,
            ogImage,
          );

          // Write to disk
          const fullPath = join(outputDir!, pageInfo.imagePath);
          await mkdir(dirname(fullPath), { recursive: true });
          await writeFile(fullPath, imageBuffer);

          console.log(`Generated OG image: ${pageInfo.imagePath}`);
        } catch (error) {
          console.error(
            `Failed to generate OG image for ${pageInfo.routePath}:`,
            error,
          );
        }
      }

      console.log('OG image generation complete!');
    },
  };
}
