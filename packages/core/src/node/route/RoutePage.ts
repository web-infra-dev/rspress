import type { RouteMeta } from '@rspress/shared';

export class RoutePage {
  routeMeta: RouteMeta;
  // TODO: add pageIndexInfo
  // pageIndexInfo: PageIndexInfo;

  static create(routeMeta: RouteMeta) {
    return new RoutePage(routeMeta);
  }

  constructor(routeMeta: RouteMeta) {
    this.routeMeta = routeMeta;
  }
}
