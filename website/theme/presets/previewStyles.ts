// Populated by the website-only source transform. Importing a preview module
// collects its compiled CSS without applying it; the provider commits it once.
const styles = new Map<string, Map<string, string>>();

export function registerPreviewStyle(
  id: string,
  resource: string,
  css: string,
) {
  let entries = styles.get(id);
  if (!entries) {
    entries = new Map();
    styles.set(id, entries);
  }
  entries.set(resource, css);
}

export function getPreviewStyles(id: string): string {
  return [...(styles.get(id)?.values() ?? [])].join('\n');
}
