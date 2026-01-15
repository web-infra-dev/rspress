import { useLang } from '@rspress/core/runtime';
import { useAllCssModification } from './CssModificationContext';

export function CssModificationIndicator() {
  const lang = useLang();
  const { hasModifications, resetAll } = useAllCssModification();

  if (!hasModifications) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(var(--rp-banner-height, 0px) + var(--rp-nav-height) + var(--rp-sidebar-menu-height) + 10px)',
        right: '16px',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'var(--rp-c-bg)',
        border: '1px solid var(--rp-c-brand)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        fontSize: '13px',
        color: 'var(--rp-c-text-1)',
      }}
    >
      <span>🎨 {lang === 'en' ? 'CSS Modified' : 'CSS 已修改'}</span>
      <button
        onClick={resetAll}
        style={{
          padding: '4px 10px',
          backgroundColor: 'var(--rp-c-brand)',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => {
          (e.target as HTMLButtonElement).style.opacity = '0.85';
        }}
        onMouseLeave={e => {
          (e.target as HTMLButtonElement).style.opacity = '1';
        }}
      >
        {lang === 'en' ? 'Reset' : '复原'}
      </button>
    </div>
  );
}
