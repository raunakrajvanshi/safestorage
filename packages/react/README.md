# @safestorage/react

React hooks for encrypted localStorage/sessionStorage. Backed by `@safestorage/core` — install this package and you get both.

## Installation

```bash
npm i @safestorage/react
```

Peer dependency: `react >= 17`

## Setup

Wrap your app (or the relevant subtree) with `StorageProvider`. Configure once — every component inside can call `useStorage` without repeating config.

```tsx
// main.tsx
import { StorageProvider } from '@safestorage/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StorageProvider
    password={import.meta.env.VITE_STORAGE_KEY}
    namespace="myapp::"
  >
    <App />
  </StorageProvider>
);
```

## `useStorage<T>(key, defaultValue)`

The everyday hook. Works like `useState` but encrypted and persistent.

```tsx
import { useStorage } from '@safestorage/react';

function ThemeToggle() {
  const [theme, setTheme, resetTheme] = useStorage('theme', 'light');

  return (
    <>
      <span>Theme: {theme}</span>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
      <button onClick={resetTheme}>Reset</button>
    </>
  );
}
```

Returns `[value, setValue, removeValue]`:

- `value` — current value (defaults to `defaultValue` while the initial async read is in flight)
- `setValue(valueOrUpdater, options?)` — encrypt and persist; supports functional updaters
- `removeValue()` — delete the key; resets state to `defaultValue`

Cross-tab sync happens automatically via the native `storage` event.

### Per-item TTL

```tsx
const [otp, setOtp] = useStorage('otp', null);

// Expires in 5 minutes
await setOtp('123456', { ttl: 5 * 60 * 1000 });
```

## `useEncryptedState<T>(key, initialValue)`

Drop-in replacement for `useState`. The API is identical — the only difference is that it persists.

```tsx
const [count, setCount] = useEncryptedState('visit-count', 0);

// Works exactly like useState:
setCount(c => c + 1);
setCount(0);
```

## Standalone (no Provider)

If `StorageProvider` doesn't fit your setup, pass `password` directly:

```tsx
const [data, setData] = useStorage('key', null, {
  password: import.meta.env.VITE_KEY,
  namespace: 'my-feature::',
  ttl: 3600_000,
});
```

## `useStorageContext()`

Access the raw `SafeStorage` instance from context — useful when you need `keys()`, `has()`, `onChange()`, or other lower-level operations.

```tsx
import { useStorageContext } from '@safestorage/react';

function DebugPanel() {
  const storage = useStorageContext();
  return <pre>{storage.keys().join('\n')}</pre>;
}
```

## License

MIT
