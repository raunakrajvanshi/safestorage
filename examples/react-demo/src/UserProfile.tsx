import React, { useState } from 'react';
import { useStorage } from '@safestorage/react';

interface Profile {
  name: string;
  email: string;
}

export const UserProfile = () => {
  const [profile, setProfile, removeProfile] = useStorage<Profile | null>('profile', null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const save = async () => {
    if (!name.trim() || !email.trim()) return;
    await setProfile({ name, email });
    setName('');
    setEmail('');
  };

  return (
    <div style={styles.wrapper}>
      {profile ? (
        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>Name</span>
            <span>{profile.name}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Email</span>
            <span>{profile.email}</span>
          </div>
          <button style={{ ...styles.btn, ...styles.danger }} onClick={removeProfile}>
            Clear Profile
          </button>
        </div>
      ) : (
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button style={styles.btn} onClick={save}>Save Profile</button>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {},
  card: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row: { display: 'flex', gap: '1rem', alignItems: 'center' },
  label: { color: '#64748b', width: 60, flexShrink: 0 },
  form: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  input: {
    background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
    padding: '0.5rem 0.75rem', color: '#e2e8f0', flex: 1, minWidth: 140, outline: 'none',
  },
  btn: {
    background: '#0284c7', color: '#fff', border: 'none', borderRadius: 8,
    padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 500,
  },
  danger: { background: '#dc2626', marginTop: '0.5rem', alignSelf: 'flex-start' },
};
