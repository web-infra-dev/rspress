import path from 'node:path';
import { expect } from '@rstest/core';
import { createSnapshotSerializer } from 'path-serializer';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    root: path.join(__dirname, '../..'),
    features: {
      escapeDoubleQuotes: false,
    },
  }),
);
