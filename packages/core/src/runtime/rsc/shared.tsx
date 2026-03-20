import type React from 'react';
import type { Page } from '../initPageData';

export type RscPayload = {
  root: React.ReactNode;
  page: Page;
  contentSource: React.ReactNode | null;
};
