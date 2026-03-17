# @safestorage/core

The framework-agnostic core of safestorage. Handles AES-GCM-256 encryption, key derivation, TTL, namespacing, and the event system. No dependencies beyond the browser's built-in Web Crypto API.

If you're using React, Vue, or Angular, install the framework-specific package instead — it depends on this one automatically.

## Installation

```bash
npm i @safestorage/core
```

## Quick start

```ts
import { SafeStorage } from '@safestorage/core';

const storage = new SafeStorage({
  password: import.meta.env.VITE_STORAGE_KEY,
  namespace: 'myapp::',
});

await storage.set('preferences', { theme: 'dark', lang: 'en' });
const prefs = await storage.get('preferences');
```

Open DevTools — the value in localStorage is an encrypted blob. Without the password, it's unreadable.

## API

### `new SafeStorage(config)`

| Option | Type | Default | Description |
|---|---|---|---|
| `password` | `string` | **required** | Passphrase for key derivation. Pull from an env var. |
| `namespace` | `string` | `""` | Prefix for all keys. e.g. `"dashboard::"` |
| `storage` | `"local" \| "session"` | `"local"` | Which Web Storage backend to use. |
| `ttl` | `number` | none | Global TTL in ms. Items past expiry are silently removed on next read. |
| `onError` | `(err: Error) => void` | `console.error` | Decryption failures, quota errors, etc. |

### `.set<T>(key, value, options?)`

```ts
await storage.set('cart', items);
await storage.set('session', token, { ttl: 30 * 60 * 1000 });
await storage.set('prefs', data, { ttl: 0 }); // no expiry even with global TTL
```

### `.get<T>(key, fallback?)`

```ts
const items = await storage.get<CartItem[]>('cart', []);
const token = await storage.get('session'); // undefined if expired or missing
```

### `.remove(key)` / `.clear()`

```ts
await storage.remove('session');
await storage.clear(); // removes all keys in this namespace
```

### `.has(key)` / `.keys()`

```ts
if (storage.has('session')) { ... }
const keys = storage.keys(); // ['cart', 'prefs', ...]
```

### `.onChange(listener)`

```ts
const off = storage.onChange((event) => {
  // event.type: 'set' | 'remove' | 'expire' | 'clear'
  console.log(event.type, event.key, event.newValue);
});

off(); // unsubscribe
```

### `createStorage(config)` — factory shorthand

```ts
import { createStorage } from '@safestorage/core';

export const storage = createStorage({ password: process.env.STORAGE_KEY });
```

## TypeScript

```ts
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

await storage.set<UserPreferences>('prefs', { theme: 'dark', language: 'en' });
const prefs = await storage.get<UserPreferences>('prefs');
// prefs?.theme → 'dark' | 'light' | undefined
```

Mock with the `ISafeStorage` interface:

```ts
import type { ISafeStorage } from '@safestorage/core';

function setupFeature(storage: ISafeStorage) { ... }
```

## Security

- AES-GCM 256-bit (authenticated encryption — tamper detection built in)
- PBKDF2 + SHA-256, 310,000 iterations per OWASP 2023 guidelines
- Fresh random 96-bit IV and 128-bit salt per write operation
- Native `SubtleCrypto` — no third-party crypto library

## Browser support

Chrome 37+, Firefox 34+, Safari 11+, Edge 12+, Node.js 16+.

## License

MIT
