import { isProduction } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { modifyConfigWithAutoNavSide } from '../../auto-nav-sidebar';
import { RuntimeModuleID, type VirtualModulePlugin } from '../types';
import { createSiteData } from './createSiteData';

type SiteDataModule = {
  code: string;
  metaFileSet: Set<string>;
  mdFileSet: Set<string>;
};

export const siteDataVMPlugin: VirtualModulePlugin = context => {
  const { config, pluginDriver } = context;
  // Production builds can request siteData from multiple compiler targets.
  // Cache the generation work to avoid repeated auto-nav/sidebar scans.
  let siteDataModulePromise: Promise<SiteDataModule> | undefined;

  const createSiteDataModule = async (
    metaFileSet = new Set<string>(),
    mdFileSet = new Set<string>(),
  ): Promise<SiteDataModule> => {
    const force = !pluginDriver.haveNavSidebarConfig;

    const now = performance.now();

    try {
      await modifyConfigWithAutoNavSide(config, metaFileSet, mdFileSet, force);
    } finally {
      logger.debug(
        `modifyConfigWithAutoNavSide - size: ${mdFileSet.size} cost: ${performance.now() - now}ms`,
      );
    }

    const { siteData } = await createSiteData(config);
    return {
      code: `export default ${JSON.stringify(siteData, null, 2)}`,
      metaFileSet,
      mdFileSet,
    };
  };

  const getSiteDataModule = (
    metaFileSet: Set<string>,
    mdFileSet: Set<string>,
  ) => {
    // Development keeps regenerating siteData so dependencies stay fresh for HMR.
    if (!isProduction()) {
      return createSiteDataModule(metaFileSet, mdFileSet);
    }
    siteDataModulePromise ??= createSiteDataModule(
      metaFileSet,
      mdFileSet,
    ).catch(error => {
      siteDataModulePromise = undefined;
      throw error;
    });
    return siteDataModulePromise;
  };

  const addSiteDataDependencies = (
    addDependency: (file: string) => void,
    metaFileSet: Set<string>,
    mdFileSet: Set<string>,
  ) => {
    for (const metaFile of metaFileSet) {
      addDependency(metaFile);
    }
    // TODO: incremental
    // perf issue of add too much md files to dependencies, trigger auto-nav-sidebar too often
    for (const mdFile of mdFileSet) {
      addDependency(mdFile);
    }
  };

  return {
    [RuntimeModuleID.SiteData]: async ({ addDependency }) => {
      const metaFileSet = new Set<string>();
      const mdFileSet = new Set<string>();
      let siteDataModule: SiteDataModule | undefined;

      try {
        siteDataModule = await getSiteDataModule(metaFileSet, mdFileSet);
        return siteDataModule.code;
      } finally {
        addSiteDataDependencies(
          addDependency,
          siteDataModule?.metaFileSet ?? metaFileSet,
          siteDataModule?.mdFileSet ?? mdFileSet,
        );
      }
    },
  };
};
