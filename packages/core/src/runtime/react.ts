import * as React from 'react';
import type { BrowserUsable } from './reactDom';

type Use = <T>(usable: PromiseLike<T> | React.Context<T> | BrowserUsable) => T;

type ReactCompat = {
  use?: Use;
  default?: ReactCompat;
};

const react = React as unknown as ReactCompat;

export const safeUse = react.use ?? react.default?.use;
