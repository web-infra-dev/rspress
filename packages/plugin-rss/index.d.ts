import type { PageFeedData } from './dist'

declare module '@rspress/core' {
  interface PageIndexInfo {
    feeds?: PageFeedData[];
  }
}

export * from './dist'
