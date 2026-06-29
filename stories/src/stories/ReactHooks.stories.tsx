import type { Meta, StoryObj } from '@storybook/html';
import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { StorageProvider, useStorage, useEncryptedState } from '@safestorage/react';

// ─── Mount helper ─────────────────────────────────────────────────────────────

function mountReact(element: React.ReactElement): HTMLElement {
  const el = document.createElement('div');
  const root = createRoot(el);
  root.render(element);
  return el;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  demo: { fontFamily: 'system-ui,sans-serif', background: '#0f172a', color: '#e2e8f0', padding: '1.5rem', borderRadius: 12, minWidth: 480, maxWidth: 640 },
  h3: { color: '#34d399', fontSize: '.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.25rem' },
  sub: { fontSize: '.8rem', color: '#475569', marginBottom: '1rem', marginTop: 0 },
  row: { display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.75rem' },
  inp: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '.45rem .75rem', color: '#e2e8f0', fontSize: '.875rem', flex: 1, minWidth: 120, outline: 'none' },
  btn: { background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.875rem', fontWeight: 500, cursor: 'pointer' },
  btnRed: { background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.875rem', fontWeight: 500, cursor: 'pointer' },
  btnGhost: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 8, padding: '.45rem 1rem', fontSize: '.875rem', cursor: 'pointer' },
  btnIcon: { background: '#059669', color: '#fff', border: 'none', borderRadius: 8, width: 40, height: 40, fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer' },
  divider: { height: 1, background: '#1e293b', margin: '1rem 0' },
  lbl: { fontSize: '.75rem', color: '#64748b', marginBottom: '.25rem' },
  box: { background: '#1e293b', borderRadius: 8, padding: '.75rem 1rem', fontFamily: 'monospace', fontSize: '.8rem', wordBreak: 'break-all', color: '#6ee7b7', minHeight: '2.5rem' },
  boxMuted: { background: '#1e293b', borderRadius: 8, padding: '.75rem 1rem', fontFamily: 'monospace', fontSize: '.8rem', color: '#475569', fontStyle: 'italic', minHeight: '2.5rem' },
  hint: { fontSize: '.75rem', color: '#475569', marginTop: '.4rem' },
  count: { fontSize: '2.5rem', fontWeight: 700, minWidth: 80, textAlign: 'center', color: '#6ee7b7' },
  pill: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: 20, padding: '.3rem 1rem', cursor: 'pointer', fontSize: '.85rem' },
  pillOn: { background: '#059669', color: '#fff', border: '1px solid #059669', borderRadius: 20, padding: '.3rem 1rem', cursor: 'pointer', fontSize: '.85rem' },
  frow: { display: 'flex', flexDirection: 'column', gap: '.25rem', marginBottom: '.75rem' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' },
};

// ─── Story 1: StorageProvider + useStorage ────────────────────────────────────

function ProfileDemo() {
  interface P { name: string; email: string }
  const [profile, setProfile, removeProfile] = useStorage<P|null>('profile', null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const save = useCallback(async () => {
    if (!name.trim() || !email.trim()) return;
    await setProfile({ name, email });
    setName(''); setEmail('');
  }, [name, email, setProfile]);

  return (
    <div>
      {profile ? (
        <div>
          <div style={s.grid2}>
            <div><div style={s.lbl}>Name</div><div style={s.box}>{profile.name}</div></div>
            <div><div style={s.lbl}>Email</div><div style={s.box}>{profile.email}</div></div>
          </div>
          <button style={{ ...s.btnRed, marginTop: '.75rem' }} onClick={removeProfile}>Clear Profile</button>
        </div>
      ) : (
        <div>
          <div style={s.frow}><div style={s.lbl}>Name</div><input style={s.inp} value={name} onChange={e => setName(e.target.value)} placeholder="Alice" /></div>
          <div style={s.frow}><div style={s.lbl}>Email</div><input style={s.inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="alice@example.com" /></div>
          <button style={s.btn} onClick={save}>Save Profile</button>
        </div>
      )}
    </div>
  );
}

function StorageProviderStory({ password, namespace }: { password: string; namespace: string }) {
  return (
    <div style={s.demo}>
      <h3 style={s.h3}>StorageProvider + useStorage</h3>
      <p style={s.sub}>Configure once at the root with StorageProvider. Call useStorage() in any child — no props drilling needed.</p>
      <StorageProvider password={password} namespace={namespace}>
        <ProfileDemo />
      </StorageProvider>
      <div style={s.hint}>Structured object encrypted end-to-end. Refresh to confirm it persists.</div>
    </div>
  );
}

// ─── Story 2: useEncryptedState (drop-in useState) ────────────────────────────

function CounterDemo({ step }: { step: number }) {
  const [count, setCount] = useEncryptedState('counter', 0);
  return (
    <div>
      <div style={s.row}>
        <button style={s.btnIcon} onClick={() => setCount(c => c - step)}>−</button>
        <span style={s.count}>{count}</span>
        <button style={s.btnIcon} onClick={() => setCount(c => c + step)}>+</button>
        <button style={{ ...s.btnGhost, marginLeft: '.5rem' }} onClick={() => setCount(0)}>Reset</button>
      </div>
      <div style={s.hint}>Step: {step} · Refresh — value persists · Same API as useState</div>
    </div>
  );
}

function EncryptedStateStory({ password, namespace, step }: { password: string; namespace: string; step: number }) {
  return (
    <div style={s.demo}>
      <h3 style={s.h3}>useEncryptedState — drop-in for useState</h3>
      <p style={s.sub}>Identical call signature to React.useState — just persists to encrypted storage automatically.</p>
      <StorageProvider password={password} namespace={namespace}>
        <CounterDemo step={step} />
      </StorageProvider>
    </div>
  );
}

// ─── Story 3: Standalone useStorage (no provider) ────────────────────────────

const THEMES = ['light', 'dark', 'system'] as const;
type Theme = typeof THEMES[number];

function StandaloneStory({ password }: { password: string }) {
  const [theme, setTheme] = useStorage<Theme>('theme', 'system', {
    password,
    namespace: 'react-standalone::',
  });
  const bg: Record<Theme, string> = { light: '#f8fafc', dark: '#0f172a', system: '#1e293b' };
  const fg: Record<Theme, string> = { light: '#0f172a', dark: '#e2e8f0', system: '#e2e8f0' };

  return (
    <div style={s.demo}>
      <h3 style={s.h3}>Standalone useStorage — no StorageProvider needed</h3>
      <p style={s.sub}>Pass password directly to useStorage for one-off keys that don't need a shared provider.</p>
      <div style={{ ...s.row, marginBottom: '1.25rem' }}>
        {THEMES.map(t => (
          <button key={t} style={theme === t ? s.pillOn : s.pill} onClick={() => setTheme(t)}>{t}</button>
        ))}
      </div>
      <div style={{ background: bg[theme as Theme], color: fg[theme as Theme], borderRadius: 10, padding: '1.25rem', transition: 'all .3s', border: '1px solid #334155' }}>
        <div style={{ fontSize: '.875rem', fontWeight: 600, marginBottom: '.25rem' }}>{theme} theme preview</div>
        <div style={{ fontSize: '.75rem', opacity: .6 }}>This reflects the stored preference.</div>
      </div>
    </div>
  );
}

// ─── Story 4: onChange / cross-tab events ─────────────────────────────────────

function EventsDemo() {
  const [log, setLog] = useState<string[]>([]);
  const [key, setKey] = useState('watched');
  const [val, setVal] = useState('hello');
  const [_, setValue] = useStorage<string>(key, '');

  const doSet = () => {
    setValue(val).then(() => {
      setLog(l => [`set   ${key} → "${val}"`, ...l.slice(0, 7)]);
    });
  };
  const doRemove = () => {
    setValue((_prev) => '').then(() => {
      setLog(l => [`remove ${key}`, ...l.slice(0, 7)]);
    });
  };

  return (
    <div>
      <div style={s.row}>
        <input style={{ ...s.inp, maxWidth: 130 }} value={key} onChange={e => setKey(e.target.value)} placeholder="key" />
        <input style={s.inp} value={val} onChange={e => setVal(e.target.value)} placeholder="value" />
      </div>
      <div style={s.row}>
        <button style={s.btn} onClick={doSet}>set()</button>
        <button style={s.btnGhost} onClick={doRemove}>remove()</button>
      </div>
      <div style={s.divider} />
      <div style={s.lbl}>Action log</div>
      {log.length === 0 ? (
        <div style={s.boxMuted}>— no actions yet —</div>
      ) : log.map((e, i) => (
        <div key={i} style={{ ...s.box, color: e.startsWith('set') ? '#6ee7b7' : '#fca5a5', marginBottom: '.4rem' }}>{e}</div>
      ))}
    </div>
  );
}

function EventsStory({ password, namespace }: { password: string; namespace: string }) {
  return (
    <div style={s.demo}>
      <h3 style={s.h3}>useStorage — reactive updates</h3>
      <p style={s.sub}>Every set/remove triggers a re-render. Open a second tab — writes propagate via the storage event.</p>
      <StorageProvider password={password} namespace={namespace}>
        <EventsDemo />
      </StorageProvider>
    </div>
  );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'SafeStorage/React',
  tags: ['autodocs'],
  argTypes: {
    password: { control: 'text', description: 'Encryption passphrase' },
    namespace: { control: 'text', description: 'Key prefix' },
    step: { control: { type: 'range', min: 1, max: 10, step: 1 }, description: 'Counter step' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const ProviderAndUseStorage: Story = {
  name: 'StorageProvider + useStorage',
  args: { password: 'react-key', namespace: 'react-sb::' },
  render: (a) => mountReact(<StorageProviderStory password={a.password as string} namespace={a.namespace as string} />),
};

export const EncryptedState: Story = {
  name: 'useEncryptedState (drop-in useState)',
  args: { password: 'react-key', namespace: 'react-sb::', step: 1 },
  render: (a) => mountReact(<EncryptedStateStory password={a.password as string} namespace={a.namespace as string} step={a.step as number} />),
};

export const StandaloneUsage: Story = {
  name: 'Standalone useStorage (no Provider)',
  args: { password: 'react-standalone-key' },
  render: (a) => mountReact(<StandaloneStory password={a.password as string} />),
};

export const ReactiveUpdates: Story = {
  name: 'Reactive Updates + Cross-Tab',
  args: { password: 'react-key', namespace: 'react-sb::' },
  render: (a) => mountReact(<EventsStory password={a.password as string} namespace={a.namespace as string} />),
};
