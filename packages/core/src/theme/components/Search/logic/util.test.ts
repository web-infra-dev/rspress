import type { Header } from '@rspress/core';
import { describe, expect, test } from '@rstest/core';
import { backTrackHeaders, normalizeTextCase } from './util';

describe('utils logic', () => {
  test('back track the headers', () => {
    const headers = [
      { depth: 1, text: '1', id: '1' },
      { depth: 2, text: '2', id: '2' },
      { depth: 3, text: '3', id: '3' },
      { depth: 4, text: '4', id: '4' },
      { depth: 5, text: '5', id: '5' },
    ];
    const res = backTrackHeaders(headers as Header[], 3);
    expect(res).toEqual([
      { depth: 2, text: '2', id: '2' },
      { depth: 3, text: '3', id: '3' },
      { depth: 4, text: '4', id: '4' },
    ]);
  });
});

describe('normalizeTextCase', () => {
  test('normalize latin text without accents for search', () => {
    expect(normalizeTextCase('CAFÉ')).toBe('cafe');
  });

  test('normalize japanese text without accents for search', () => {
    expect(normalizeTextCase('ご')).toBe('ご');
    expect(normalizeTextCase('ガ')).toBe('ガ');
  });

  test('normalize cyrillic text without accents for search', () => {
    expect(normalizeTextCase('ПРИВЕТ')).toBe('привет');
  });

  test('normalize korean text without accents for search', () => {
    expect(normalizeTextCase('안녕하세요')).toBe('안녕하세요');
  });
});
