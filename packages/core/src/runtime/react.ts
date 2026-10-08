import * as React from 'react';
import type { BrowserUsable } from './reactDom';

export interface UntrackedReactPromise<T> extends PromiseLike<T> {
  status?: void;
}

export interface PendingReactPromise<T> extends PromiseLike<T> {
  status: 'pending';
}

export interface FulfilledReactPromise<T> extends PromiseLike<T> {
  status: 'fulfilled';
  value: T;
}

export interface RejectedReactPromise<T> extends PromiseLike<T> {
  status: 'rejected';
  reason: unknown;
}

export type ReactPromise<T> =
  | UntrackedReactPromise<T>
  | PendingReactPromise<T>
  | FulfilledReactPromise<T>
  | RejectedReactPromise<T>;

export type Usable<T> = ReactPromise<T> | React.Context<T> | BrowserUsable;

export type Use = <T>(usable: Usable<T>) => T;

type ReactCompat = {
  use?: Use;
  default?: ReactCompat;
};

const react = React as unknown as ReactCompat;

export const safeUse = react.use ?? react.default?.use;
