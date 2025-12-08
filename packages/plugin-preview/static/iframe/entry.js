const storageKey = 'rspress-plugin-preview-theme-appearance';

function setDocumentTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
  localStorage.setItem(
    'rspress-plugin-preview-theme-appearance',
    isDark ? 'dark' : 'light',
  );
}

const saved = localStorage.getItem(storageKey) || 'light';
setDocumentTheme(saved === 'dark');

window.addEventListener('message', event => {
  if (event.data.type === 'theme-change') {
    const isDark = event.data.dark;
    setDocumentTheme(isDark);
  }
});
