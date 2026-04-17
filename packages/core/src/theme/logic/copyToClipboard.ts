import copy from 'copy-to-clipboard';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to copy-to-clipboard when the async clipboard API is unavailable.
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  return copy(text);
}
