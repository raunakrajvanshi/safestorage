# safestorage

Encrypted `localStorage` and `sessionStorage` for the browser. Zero crypto dependencies — everything runs through the Web Crypto API already built into your browser.

Every value is encrypted with **AES-256-GCM** before it touches storage and decrypted on the way out. Open DevTools → Application → Local Storage and you'll see opaque base64 blobs, not readable JSON.

---

## Packages

Install only what you need. Framework adapters automatically pull in `@safestorage/core`.

| Package | Install | What you get |
|---|---|---|
| [`@safestorage/core`](./packages/core) | `npm i @safestorage/core` | Framework-agnostic `SafeStorage` class |
| [`@safestorage/react`](./packages/react) | `npm i @safestorage/react` | `useStorage`, `useEncryptedState`, `StorageProvider` |
| [`@safestorage/vue`](./packages/vue) | `npm i @safestorage/vue` | `useStorage` composable |
| [`@safestorage/angular`](./packages/angular) | `npm i @safestorage/angular` | `SafeStorageService`, `provideSafeStorage` |

---

## Quick start

### Core (framework-agnostic)

```ts
import { SafeStorage } from '@safestorage/core';

const storage = new SafeStorage({
  password: import.meta.env.VITE_STORAGE_KEY,
  namespace: 'myapp::',        // scopes all keys — strongly recommended
  storage: 'local',            // 'local' (default) | 'session'
  ttl: 30 * 60 * 1000,        // optional global TTL in ms
});

await storage.set('user', { id: 1, name: 'Alice' });
const user  = await storage.get('user');           // { id: 1, name: 'Alice' }
const miss  = await storage.get('nope', null);     // null  (fallback)
await storage.remove('user');
await storage.clear();                             // ⚠ clears entire namespace

// Synchronous helpers
storage.has('user');             // ⚠ returns true even for expired entries — use get() to be sure
storage.keys();                  // [] — all keys in this namespace
storage.resolveKey('user');      // 'myapp::user' — raw key for StorageEvent filtering

// Change events
const off = storage.onChange((event) => {
  console.log(event.type, event.key, event.newValue);
});
off(); // unsubscribe
```

### React

Configure once at the root with `StorageProvider`; call `useStorage` in any child without prop-drilling.

```tsx
// main.tsx
import { StorageProvider } from '@safestorage/react';

createRoot(document.getElementById('root')!).render(
  <StorageProvider password={import.meta.env.VITE_KEY} namespace="myapp::">
    <App />
  </StorageProvider>
);
```

```tsx
// AnyComponent.tsx
import { useStorage, useEncryptedState } from '@safestorage/react';

// [value, setValue, removeValue] — persists across page reloads
const [user, setUser, removeUser] = useStorage<User>('user', null);

// Drop-in for React.useState — identical call signature, auto-persists
const [count, setCount] = useEncryptedState('counter', 0);
setCount(c => c + 1); // functional updates work

// Standalone (no provider required)
const [theme, setTheme] = useStorage('theme', 'light', {
  password: import.meta.env.VITE_KEY,
  namespace: 'prefs::',
});

// Per-write TTL
await setToken(jwt, { ttl: 60 * 60 * 1000 }); // expires in 1 hour
```

### Vue 3

```ts
import { useStorage } from '@safestorage/vue';

const {
  value: user,   // Readonly<Ref<User | null>> — reactive, updates across tabs
  set,           // (value, options?) => Promise<void>
  remove,        // () => Promise<void>
  ready,         // Readonly<Ref<boolean>> — true once the initial async read completes
} = useStorage<User | null>('user', null, {
  password: import.meta.env.VITE_KEY,
  namespace: 'myapp::',
});
```

```vue
<template>
  <div v-if="!ready">Loading…</div>
  <div v-else>{{ user?.name }}</div>
</template>
```

### Angular

#### Standalone apps (Angular 15+)

```ts
// app.config.ts
import { provideSafeStorage } from '@safestorage/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSafeStorage({ password: environment.storageKey, namespace: 'myapp::' }),
  ],
};
```

#### NgModule apps

```ts
// app.module.ts
import { SafeStorageModule } from '@safestorage/angular';

@NgModule({
  providers: [
    ...SafeStorageModule.forRoot({ password: environment.storageKey, namespace: 'myapp::' }),
  ],
})
export class AppModule {}
```

#### Component usage

```ts
import { Component, inject, OnInit } from '@angular/core';
import { SafeStorageService } from '@safestorage/angular';

@Component({ standalone: true, ... })
export class ProfileComponent implements OnInit {
  private readonly storage = inject(SafeStorageService);

  // Angular signal — reactive, no async pipe or .subscribe() needed (Angular 16+)
  readonly theme = this.storage.toSignal('theme', 'light');

  async ngOnInit() {
    const user = await this.storage.get<User>('user');
  }

  async setTheme(t: string) {
    await this.storage.setSignal('theme', t); // signal updates automatically
  }
}
```

---

## Security model

| Property | Detail |
|---|---|
| **Algorithm** | AES-256-GCM — authenticated encryption; any tampering changes the auth tag and causes decryption to throw |
| **Key derivation** | PBKDF2-SHA256, 310 000 iterations (OWASP 2023 recommendation), 256-bit random salt per entry |
| **IV** | 96-bit random nonce, unique per `set()` call — encrypting the same value twice produces different ciphertext |
| **Wire format** | `{ iv, ct, salt }` — all base64, no plaintext ever written to storage |
| **Implementation** | 100% browser `SubtleCrypto` — zero third-party crypto dependencies |

> **What this doesn't prevent:** If an attacker can execute arbitrary JavaScript in your page (XSS), they can call `storage.get()` directly. Encryption protects data at rest from passive inspection, not from code running in the same origin.

Keep your `password` out of source control. Pull it from an environment variable and rotate it on sign-out.

---

## Configuration

```ts
new SafeStorage({
  password: string;               // Required. PBKDF2 passphrase — never hardcode.
  namespace?: string;             // Key prefix, e.g. 'app::'. Strongly recommended.
  storage?: 'local' | 'session'; // localStorage (default) | sessionStorage
  ttl?: number;                   // Global TTL in ms. Overridable per set() call.
  onError?: (err: Error) => void; // Defaults to console.error. Hook into Sentry, etc.
})
```

### TTL examples

```ts
// Global TTL — all keys expire in 30 min unless overridden
const storage = new SafeStorage({ password, ttl: 30 * 60 * 1000 });

// Per-write override: store this key permanently
await storage.set('settings', prefs, { ttl: 0 });

// Short-lived OTP
await storage.set('otp', code, { ttl: 5 * 60 * 1000 });

// Expiry is checked lazily on get() — expired items are silently removed
const otp = await storage.get('otp'); // undefined after TTL
```

---

## API reference

### `SafeStorage` (`@safestorage/core`)

```ts
class SafeStorage {
  constructor(config: SafeStorageConfig)

  set<T>(key: string, value: T, options?: { ttl?: number }): Promise<void>
  get<T>(key: string, fallback?: T): Promise<T | undefined>
  remove(key: string): Promise<void>
  clear(): Promise<void>              // ⚠ clears entire namespace (all of localStorage if no namespace)

  has(key: string): boolean           // ⚠ true even for expired entries — use get() as the authoritative check
  keys(): string[]                    // unprefixed keys in this namespace
  resolveKey(key: string): string     // raw storage key with namespace prefix (e.g. 'myapp::user')

  onChange<T>(listener: (event: StorageChangeEvent<T>) => void): () => void
}

type StorageChangeEvent<T> = {
  type: 'set' | 'remove' | 'expire' | 'clear';
  key: string | null;
  newValue?: T;
  oldValue?: T;
}
```

### `@safestorage/react`

```ts
// Wrap your app once
<StorageProvider password={string} namespace?={string} storage?={'local'|'session'} ttl?={number}>

// Hook — behaves like useState with encrypted persistence
useStorage<T>(key, defaultValue, options?)
  → [value: T, setValue: (v: T | ((prev: T) => T), opts?) => Promise<void>, removeValue: () => Promise<void>]

// Hook — drop-in for React.useState
useEncryptedState<T>(key, initialValue, options?)
  → [value: T, dispatch: Dispatch<SetStateAction<T>>]

// Imperative access
useStorageContext() → SafeStorage        // throws outside a provider
useStorageContextMaybe() → SafeStorage | null
```

### `@safestorage/vue`

```ts
useStorage<T>(key: string, defaultValue: T, options: UseStorageOptions)
  → {
    value:  Readonly<Ref<T>>,
    set:    (value: T, options?: SetOptions) => Promise<void>,
    remove: () => Promise<void>,
    ready:  Readonly<Ref<boolean>>,
  }
```

### `@safestorage/angular`

```ts
// Registration
provideSafeStorage(config: SafeStorageConfig): Provider[]          // standalone
SafeStorageModule.forRoot(config: SafeStorageConfig): Provider[]   // NgModule

// Service
class SafeStorageService {
  set<T>(key, value, options?): Promise<void>
  get<T>(key, fallback?): Promise<T | undefined>
  remove(key): Promise<void>
  clear(): Promise<void>
  has(key): boolean
  keys(): string[]
  onChange<T>(listener): () => void

  // Angular signals (16+)
  toSignal<T>(key: string, defaultValue: T): Signal<T>   // read-only
  setSignal<T>(key: string, value: T, options?): Promise<void>
}
```

---

## Cross-tab sync

All framework adapters subscribe to the `storage` event and update reactive state automatically when another tab writes to the same key. No extra configuration needed.

```ts
// Tab A
await storage.set('cart', updatedItems);

// Tab B — hook / composable / signal updates without any polling
```

---

## Storybook

Interactive demos for core, React, Vue, and Angular live in `stories/`:

```bash
cd stories && npm install && npm run dev  # → http://localhost:6006
# or from the repo root:
npm run storybook
```

Covers: basic CRUD, encrypted output inspection, TTL & expiry, namespace scoping, change events, session storage, and framework-specific patterns (React hooks, Vue composable, Angular signals).

---

## Development

```bash
npm install          # install all workspace dependencies

npm run build        # build core first, then react/vue/angular in parallel
npm test             # run all package test suites
npm run typecheck    # typecheck all packages
npm run lint         # eslint all packages
npm run format       # prettier all source files

# Example apps
npm run examples:react     # http://localhost:5173
npm run examples:vue       # http://localhost:5174
npm run examples:angular   # http://localhost:4200
```

### Monorepo layout

```
packages/
├── core/       @safestorage/core    — SafeStorage class, crypto, serializer, types
├── react/      @safestorage/react   — useStorage, useEncryptedState, StorageProvider
├── vue/        @safestorage/vue     — useStorage composable
└── angular/    @safestorage/angular — SafeStorageService, provideSafeStorage, SafeStorageModule

examples/
├── react-demo/     Vite + React 18
├── vue-demo/       Vite + Vue 3
└── angular-demo/   Angular 18 CLI app

stories/            Storybook 8 (html-vite, renders Vue + React inline)
```

---

## License

MIT
