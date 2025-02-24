import type { PageFeedData } from './dist'

declare module '@rspress/shared' {
  interface PageIndexInfo {
    feeds?: PageFeedData[];
  }
}

export * from './dist'
