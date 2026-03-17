# safestorage

Encrypted localStorage and sessionStorage for the browser. Zero crypto dependencies — it uses the Web Crypto API that's already in your browser.

This is a monorepo. Install only what you need:

| Package | Install | Description |
|---|---|---|
| [`@safestorage/core`](./packages/core) | `npm i @safestorage/core` | Framework-agnostic core |
| [`@safestorage/react`](./packages/react) | `npm i @safestorage/react` | React hooks |
| [`@safestorage/vue`](./packages/vue) | `npm i @safestorage/vue` | Vue 3 composable |
| [`@safestorage/angular`](./packages/angular) | `npm i @safestorage/angular` | Angular service + module |

`@safestorage/react`, `@safestorage/vue`, and `@safestorage/angular` each depend on `@safestorage/core` automatically — you don't need to install core separately unless you're using it directly.

---

## Quick look

```ts
// Vanilla / framework-agnostic
import { SafeStorage } from '@safestorage/core';

const storage = new SafeStorage({ password: 'my-app-secret' });
await storage.set('user', { id: 1, name: 'Alice' });
const user = await storage.get('user');
```

```tsx
// React
import { StorageProvider, useStorage } from '@safestorage/react';

function App() {
  return (
    <StorageProvider password={import.meta.env.VITE_KEY}>
      <Dashboard />
    </StorageProvider>
  );
}

function Dashboard() {
  const [theme, setTheme] = useStorage('theme', 'light');
  return <button onClick={() => setTheme('dark')}>{theme}</button>;
}
```

```ts
// Vue
import { useStorage } from '@safestorage/vue';

const { value: theme, set: setTheme } = useStorage('theme', 'light', {
  password: import.meta.env.VITE_KEY,
});
```

```ts
// Angular
import { provideSafeStorage } from '@safestorage/angular';

// app.config.ts
providers: [provideSafeStorage({ password: environment.storageKey })]
```

---

## Why this exists

The usual advice is "don't store sensitive data in localStorage." That's fair — but sometimes you have no good alternative. Maybe you're building an offline-first app, caching tokens in a PWA, or persisting user preferences that you'd rather not expose to anyone who opens DevTools.

This library doesn't make localStorage a vault. It makes it meaningfully harder to extract data from. That's the honest goal.

---

## Security notes

- **AES-GCM 256-bit** encryption (authenticated — tampering is detected)
- **PBKDF2 with 310,000 iterations** for key derivation (OWASP 2023)
- **Random 96-bit IV + 128-bit salt** generated fresh per write — same value encrypted twice produces different ciphertext
- Everything via the browser's native `SubtleCrypto` API — no third-party crypto

**What this doesn't protect against:** Sophisticated XSS where the attacker can call your own JS after the page is initialized. If they can run arbitrary code in your page, they can call `storage.get()` directly.

---

## Monorepo structure

```
packages/
├── core/      @safestorage/core     — SafeStorage class, encrypt/decrypt, types
├── react/     @safestorage/react    — useStorage, useEncryptedState, StorageProvider
├── vue/       @safestorage/vue      — useStorage composable
└── angular/   @safestorage/angular  — SafeStorageService, SafeStorageModule
```

Each package has its own `README.md` with full API documentation, examples, and usage details.

---

## Development

```bash
# Install all workspace dependencies
npm install

# Build a specific package
cd packages/core && npm run build
cd packages/react && npm run build

# Build all packages (core must build first)
npm run build --workspaces --if-present

# Run tests
cd packages/core && npm test
cd packages/react && npm test

# Run all tests
npm test --workspaces --if-present
```

---

## License

MIT
