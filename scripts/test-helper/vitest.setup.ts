import path from 'node:path';
import { createSnapshotSerializer } from 'path-serializer';
import { expect } from 'vitest';

expect.addSnapshotSerializer(
  createSnapshotSerializer({
    root: path.join(__dirname, '../..'),
    features: {
      escapeDoubleQuotes: false,
    },
  }),
);
