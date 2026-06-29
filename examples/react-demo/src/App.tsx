import React from 'react';
import { useStorage, useEncryptedState } from '@safestorage/react';
import { UserProfile } from './UserProfile';
import { Counter } from './Counter';
import { ThemeToggle } from './ThemeToggle';

export const App = () => {
  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.title}>SafeStorage — React Demo</h1>
        <p style={styles.subtitle}>
          All values below are encrypted in localStorage. Open DevTools → Application → Local Storage to see the ciphertext.
        </p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>useStorage — User Profile</h2>
          <p style={styles.hint}>Persists a structured object. Refresh the page — values survive.</p>
          <UserProfile />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>useEncryptedState — Counter</h2>
          <p style={styles.hint}>Drop-in for useState that auto-persists. Refresh to confirm.</p>
          <Counter />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>useStorage — Theme Preference</h2>
          <p style={styles.hint}>Standalone usage (no StorageProvider required for this key).</p>
          <ThemeToggle />
        </section>
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', padding: '2rem' },
  header: { maxWidth: 760, margin: '0 auto 2.5rem', textAlign: 'center' },
  title: { fontSize: '2rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem' },
  subtitle: { color: '#94a3b8', lineHeight: 1.6 },
  main: { maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  section: { background: '#1e293b', borderRadius: 12, padding: '1.5rem', border: '1px solid #334155' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, color: '#7dd3fc', marginBottom: '0.4rem' },
  hint: { color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' },
};
