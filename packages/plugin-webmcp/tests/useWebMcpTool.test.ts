import { describe, expect, test } from '@rstest/core';
import { toDescriptorDependency } from '../src/runtime/useWebMcpTool';

describe('useWebMcpTool descriptor dependencies', () => {
  test('creates stable errors for non-serializable descriptors', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const first = toDescriptorDependency(circular);
    const second = toDescriptorDependency(circular);

    expect(first.key).toBe(second.key);
    expect(first.error).toBeInstanceOf(TypeError);
    expect(first.error?.message).toContain('must be JSON-serializable');
    expect(toDescriptorDependency({ value: 1n }).key).toContain(
      'serialization-error',
    );
  });

  test('tracks serializable descriptor changes by value', () => {
    const schema = { type: 'object', properties: {} };
    const before = toDescriptorDependency(schema);
    schema.properties = { query: { type: 'string' } };
    const after = toDescriptorDependency(schema);

    expect(before.error).toBeNull();
    expect(after.error).toBeNull();
    expect(before.key).not.toBe(after.key);
  });
});
