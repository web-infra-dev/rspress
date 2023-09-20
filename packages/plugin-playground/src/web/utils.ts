const loadingMap = new Map<string, Promise<void>>();

export function loadScript(url: string): Promise<void> {
  const exists = loadingMap.get(url);
  if (exists) {
    return exists;
  }
  const n: Promise<void> = new Promise(resolve => {
    const e = document.createElement('script');
    e.src = url;
    e.onload = () => resolve();
    document.body.appendChild(e);
  });
  loadingMap.set(url, n);
  return n;
}

export function normalizeUrl(u: string) {
  return u.replace(/\/\//g, '/');
}
