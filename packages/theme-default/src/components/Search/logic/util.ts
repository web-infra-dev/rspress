import type { RemoteSearchIndexInfo, Header } from '@rspress/shared';

const MAX_TITLE_LENGTH = 20;
const kRegex = /[\u3131-\u314e|\u314f-\u3163|\uac00-\ud7a3]/u;
const cyrillicRegex = /[\u0400-\u04FF]/u;

export function backTrackHeaders(
  rawHeaders: Header[],
  index: number,
): Header[] {
  let current = rawHeaders[index];
  let currentIndex = index;

  const res: Header[] = [current];
  while (current && current.depth > 2) {
    // If there is no parent header, we will stop the loop
    let matchedParent = false;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const header = rawHeaders[i];
      if (header.depth > 1 && header.depth === current.depth - 1) {
        current = header;
        currentIndex = i;
        res.unshift(current);
        matchedParent = true;
        break;
      }
    }
    if (!matchedParent) {
      break;
    }
  }
  return res;
}

export function formatText(text: string) {
  return text.length > MAX_TITLE_LENGTH
    ? `${text.slice(0, MAX_TITLE_LENGTH)}...`
    : text;
}

export function normalizeTextCase(text: string | number) {
  const textNormalized = text.toString().toLowerCase().normalize('NFD');
  const resultWithAccents = textNormalized;
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: temporarily ignore
  const resultWithoutAccents = textNormalized.replace(/[\u0300-\u036f]/g, '');
  if (cyrillicRegex.test(String(text))) {
    return resultWithAccents.normalize('NFC');
  }
  if (kRegex.test(String(text))) {
    return resultWithoutAccents.normalize('NFC');
  }
  return resultWithoutAccents;
}

export function removeDomain(url: string) {
  return url.replace(/https?:\/\/[^/]+/, '');
}

function getCharByteCount(char: string) {
  const charCode = char.charCodeAt(0);
  if (charCode > 255) {
    // Chinese character
    return 3;
  }

  return 1;
}

export const normalizeSearchIndexes = (
  items: RemoteSearchIndexInfo[],
): { value: string; label: string }[] => {
  return items.map(item =>
    typeof item === 'string'
      ? {
          value: item,
          label: item,
        }
      : item,
  );
};

export function substrByBytes(str: string, start: number, len: number): string {
  let resultStr = '';
  let bytesCount = 0;
  const strLength = str.length;
  for (let i = 0; i < strLength; i++) {
    bytesCount += getCharByteCount(str.charAt(i));
    if (bytesCount > start + len) {
      break;
    }
    if (bytesCount > start) {
      resultStr += str.charAt(i);
    }
  }
  return resultStr;
}

export function byteToCharIndex(str: string, byteIndex: number): number {
  let charIndex = 0;
  let byteCount = 0;

  for (let i = 0; i < str.length; i++) {
    if (byteCount >= byteIndex) {
      break;
    }

    byteCount += getCharByteCount(str.charAt(i));

    charIndex++;
  }

  return charIndex;
}

/**
 *
 * @param str raw text content
 * @param start start index (char index)
 * @param length byte length for sliced string
 * @returns sliced string
 */
export function getSlicedStrByByteLength(
  str: string,
  start: number,
  length: number,
): string {
  const slicedStr = str.slice(start);
  return substrByBytes(slicedStr, 0, length);
}

export function getStrByteLength(str: string): number {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    byteLength += getCharByteCount(str.charAt(i));
  }
  return byteLength;
}
