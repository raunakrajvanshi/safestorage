import React from 'react';
import { useEncryptedState } from '@safestorage/react';

export const Counter = () => {
  const [count, setCount] = useEncryptedState('counter', 0);

  return (
    <div style={styles.row}>
      <button style={styles.btn} onClick={() => setCount(c => c - 1)}>−</button>
      <span style={styles.count}>{count}</span>
      <button style={styles.btn} onClick={() => setCount(c => c + 1)}>+</button>
      <button style={styles.reset} onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  row: { display: 'flex', alignItems: 'center', gap: '1rem' },
  btn: {
    background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8,
    width: 40, height: 40, fontSize: '1.25rem', cursor: 'pointer', fontWeight: 700,
  },
  count: { fontSize: '2rem', fontWeight: 700, minWidth: 60, textAlign: 'center' },
  reset: {
    background: 'transparent', color: '#64748b', border: '1px solid #334155',
    borderRadius: 8, padding: '0.4rem 0.75rem', cursor: 'pointer',
  },
};
