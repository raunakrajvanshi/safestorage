# safestorage

Encrypted localStorage and sessionStorage for the browser. Zero crypto dependencies — it uses the Web Crypto API that's already in your browser.

```ts
import { SafeStorage } from 'safestorage';

const storage = new SafeStorage({ password: 'my-app-secret' });

await storage.set('user', { id: 1, name: 'Alice' });
const user = await storage.get('user');
// → { id: 1, name: 'Alice' }
```

Open your browser DevTools right now. You'll see the key is stored as an unreadable blob — the value is AES-GCM-256 encrypted with a per-item random IV and salt. Someone grabbing the raw storage contents gets nothing useful.

---

## Why this exists

The usual advice is "don't store sensitive data in localStorage." That's fair — but sometimes you have no good alternative. Maybe you're building an offline-first app, caching tokens in a PWA, or persisting user preferences that you'd rather not expose to anyone who opens DevTools.

This library doesn't make localStorage a vault. It makes it meaningfully harder to extract data from. That's the honest goal.

---

## Installation

```bash
npm install safestorage
```

Framework adapters are available as separate entry points so your bundle only includes what you use:

```bash
# React hooks
import { useStorage } from 'safestorage/react';

# Vue composables
import { useStorage } from 'safestorage/vue';

# Angular service
import { SafeStorageService } from 'safestorage/angular';
```

---

## Core API

### `new SafeStorage(config)`

| Option | Type | Default | Description |
|---|---|---|---|
| `password` | `string` | **required** | Passphrase for AES key derivation via PBKDF2. Pull this from an env var — don't hardcode it. |
| `namespace` | `string` | `""` | Prefix applied to every key. Useful for scoping by feature or user. e.g. `"dashboard::"` |
| `storage` | `"local" \| "session"` | `"local"` | Which Web Storage backend to use. |
| `ttl` | `number` | none | Global default TTL in ms. Items past expiry are silently removed on next read. |
| `onError` | `(err: Error) => void` | `console.error` | Called when encryption/decryption fails. Wire this into Sentry or similar. |

### `.set<T>(key, value, options?)`

Encrypt and write a value. Supports any JSON-serializable type.

```ts
await storage.set('cart', items);
await storage.set('session', token, { ttl: 30 * 60 * 1000 }); // expires in 30 min
```

### `.get<T>(key, fallback?)`

Decrypt and return a value. Returns `fallback` (default: `undefined`) if the key doesn't exist, has expired, or can't be decrypted.

```ts
const items = await storage.get<CartItem[]>('cart', []);
const token = await storage.get('session'); // undefined if expired
```

### `.remove(key)`

Delete a single key. Silent no-op if it doesn't exist.

```ts
await storage.remove('session');
```

### `.clear()`

Remove all keys in this instance's namespace. If no namespace is configured, this clears everything in the storage backend, so use namespaces.

```ts
await storage.clear();
```

### `.has(key)`

Synchronous check for whether a key exists. Does not check TTL — use `.get()` if you need expiry-aware presence checks.

```ts
if (storage.has('session')) { ... }
```

### `.keys()`

Returns a list of unprefixed keys managed by this instance.

```ts
const keys = storage.keys(); // ['cart', 'theme', ...]
```

### `.onChange(listener)`

Subscribe to storage changes from this instance. Returns an unsubscribe function.

```ts
const off = storage.onChange((event) => {
  console.log(event.type, event.key, event.newValue);
});

// stop listening
off();
```

Events: `"set"` | `"remove"` | `"expire"` | `"clear"`

---

## Factory function

If you prefer not to write `new`, there's a `createStorage` shorthand:

```ts
import { createStorage } from 'safestorage';

export const storage = createStorage({
  password: import.meta.env.VITE_STORAGE_KEY,
  namespace: 'myapp::',
});
```

---

## React

### Setup with `StorageProvider`

Configure once at your app root. Every component in the tree can then use `useStorage` without passing config every time.

```tsx
// main.tsx
import { StorageProvider } from 'safestorage/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StorageProvider
    password={import.meta.env.VITE_STORAGE_KEY}
    namespace="myapp::"
  >
    <App />
  </StorageProvider>
);
```

### `useStorage<T>(key, defaultValue)`

The everyday hook. Returns `[value, setValue, removeValue]` — just like `useState`, but encrypted and persistent.

```tsx
import { useStorage } from 'safestorage/react';

function ThemeToggle() {
  const [theme, setTheme] = useStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current: {theme}
    </button>
  );
}
```

- Syncs across browser tabs automatically.
- Functional updater form works exactly like `useState`.
- Per-item TTL: `setValue(data, { ttl: 60_000 })`.

### `useEncryptedState<T>(key, initialValue)`

A true drop-in for `useState`. The API is identical — the only difference is that it persists.

```tsx
const [count, setCount] = useEncryptedState('visit-count', 0);
setCount(c => c + 1); // works exactly as useState
```

### Standalone (without Provider)

You can use the hooks without a Provider by passing `password` directly:

```tsx
const [data, setData] = useStorage('key', null, {
  password: import.meta.env.VITE_KEY,
  namespace: 'standalone::',
});
```

---

## Vue

```ts
import { useStorage } from 'safestorage/vue';

const { value: theme, set: setTheme, remove: resetTheme, ready } = useStorage('theme', 'light', {
  password: import.meta.env.VITE_STORAGE_KEY,
  namespace: 'prefs::',
});
```

`value` is a readonly Vue `Ref<T>` — use it in templates directly:

```vue
<template>
  <p v-if="ready">Theme: {{ theme }}</p>
  <button @click="setTheme('dark')">Go dark</button>
</template>
```

`ready` flips to `true` once the initial async read from storage completes, which is useful to avoid a flash of the default value on first render.

**Returns:**

| Field | Type | Description |
|---|---|---|
| `value` | `Readonly<Ref<T>>` | Reactive ref to the current value |
| `set(value, options?)` | `async` | Write and encrypt a new value |
| `remove()` | `async` | Delete the key; resets `value` to default |
| `ready` | `Readonly<Ref<boolean>>` | `true` once the first read resolves |

---

## Angular

### Standalone setup (Angular 15+)

```ts
// app.config.ts
import { provideSafeStorage } from 'safestorage/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSafeStorage({
      password: environment.storageKey,
      namespace: 'myapp::',
    }),
  ],
};
```

### NgModule setup

```ts
// app.module.ts
import { SafeStorageModule } from 'safestorage/angular';

@NgModule({
  imports: [
    SafeStorageModule.forRoot({
      password: environment.storageKey,
      namespace: 'myapp::',
    }),
  ],
})
export class AppModule {}
```

Feature modules can use `SafeStorageModule.forChild(config)` with a different namespace if needed.

### Injecting the service

```ts
import { SafeStorageService } from 'safestorage/angular';

@Component({ ... })
export class CartComponent implements OnDestroy {
  private off: () => void;

  constructor(private storage: SafeStorageService) {
    this.off = this.storage.onChange(event => {
      console.log('storage changed:', event);
    });
  }

  async saveCart(items: CartItem[]) {
    await this.storage.set('cart', items, { ttl: 86400_000 });
  }

  async loadCart(): Promise<CartItem[]> {
    return await this.storage.get<CartItem[]>('cart', []) ?? [];
  }

  ngOnDestroy() {
    this.off();
  }
}
```

### Signals (Angular 16+)

```ts
@Component({ ... })
export class ThemeComponent {
  readonly theme: Signal<string>;

  constructor(private storage: SafeStorageService) {
    this.theme = this.storage.toSignal('theme', 'light');
  }

  toggleTheme() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    void this.storage.setSignal('theme', next);
  }
}
```

---

## TypeScript

Everything is generic. Pass your type to `get<T>()` and `set<T>()` and you'll have full IntelliSense and type checking.

```ts
interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

await storage.set<UserPreferences>('prefs', {
  theme: 'dark',
  language: 'en',
  notifications: true,
});

const prefs = await storage.get<UserPreferences>('prefs');
// prefs?.theme → 'dark' | 'light' | undefined
```

If you want to mock the storage in tests, use the `ISafeStorage` interface:

```ts
import type { ISafeStorage } from 'safestorage';

function setupFeature(storage: ISafeStorage) {
  // testable with a simple mock object
}
```

---

## TTL (time-to-live)

Set a global TTL on the instance, or per-item:

```ts
// Global: all items expire after 1 hour unless overridden
const storage = new SafeStorage({ password: '...', ttl: 3600_000 });

// Per item: this one expires in 5 minutes
await storage.set('otp', '123456', { ttl: 5 * 60 * 1000 });

// No TTL on this one, even though the instance has a global default:
await storage.set('preferences', data, { ttl: 0 });
```

Expired items are removed from storage the first time a `get()` is attempted for that key. An `"expire"` event is emitted when this happens.

---

## Security

**What this protects against:**

- Someone extracting your localStorage via DevTools or a browser extension — the data is encrypted and unreadable without the key.
- Simple XSS attacks that read localStorage directly — the attacker gets ciphertext, not values.

**What this does not protect against:**

- Sophisticated XSS — if an attacker can run arbitrary JavaScript on your page, they can call `storage.get()` directly after it's been initialized with the password. Encryption at rest doesn't help if the decryption key is also in the page.
- The password/key being exposed — if you hardcode `password: "secret"` in your frontend bundle, anyone who reads your bundle can decrypt the storage. Use environment variables and consider key rotation.
- Physical access with a live session — the decrypted values are in memory while the page is open.

**Cryptographic details:**

- Algorithm: AES-GCM 256-bit (provides authenticated encryption — tampering is detected)
- Key derivation: PBKDF2 with SHA-256, 310,000 iterations (OWASP 2023 recommendation)
- IV: 96-bit random, freshly generated per write
- Salt: 128-bit random, freshly generated per write, stored alongside the ciphertext
- All via the browser's native `SubtleCrypto` API — no third-party crypto code

---

## Browser support

Works wherever the Web Crypto API (`SubtleCrypto`) is available:

| Browser | Minimum version |
|---|---|
| Chrome | 37 |
| Firefox | 34 |
| Safari | 11 |
| Edge | 12 |
| Node.js | 16 |

If `SubtleCrypto` isn't available, the constructor will throw immediately with a clear error message.

---

## License

MIT
