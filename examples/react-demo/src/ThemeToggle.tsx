import React from 'react';
import { useStorage } from '@safestorage/react';

const THEMES = ['light', 'dark', 'system'] as const;
type Theme = typeof THEMES[number];

export const ThemeToggle = () => {
  const [theme, setTheme] = useStorage<Theme>('theme', 'system', {
    password: 'standalone-key-5678',
    namespace: 'prefs::',
  });

  return (
    <div style={styles.row}>
      {THEMES.map(t => (
        <button
          key={t}
          style={{ ...styles.pill, ...(theme === t ? styles.active : {}) }}
          onClick={() => setTheme(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', gap: '0.5rem' },
  pill: {
    background: '#0f172a', color: '#94a3b8', border: '1px solid #334155',
    borderRadius: 20, padding: '0.4rem 1.1rem', cursor: 'pointer', textTransform: 'capitalize',
  },
  active: { background: '#0284c7', color: '#fff', borderColor: '#0284c7' },
};
