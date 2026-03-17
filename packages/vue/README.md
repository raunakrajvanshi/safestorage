# @safestorage/vue

Vue 3 composable for encrypted localStorage/sessionStorage. Backed by `@safestorage/core` — install this package and you get both.

## Installation

```bash
npm i @safestorage/vue
```

Peer dependency: `vue >= 3`

## `useStorage<T>(key, defaultValue, options)`

```ts
import { useStorage } from '@safestorage/vue';

const { value: theme, set: setTheme, remove: resetTheme, ready } = useStorage('theme', 'light', {
  password: import.meta.env.VITE_STORAGE_KEY,
  namespace: 'prefs::',
});
```

Returns:

| Field | Type | Description |
|---|---|---|
| `value` | `Readonly<Ref<T>>` | Reactive ref — use directly in templates |
| `set(value, options?)` | `async` | Encrypt and persist a new value |
| `remove()` | `async` | Delete the key; resets `value` to default |
| `ready` | `Readonly<Ref<boolean>>` | `true` once the initial read from storage completes |

### In a component

```vue
<script setup lang="ts">
import { useStorage } from '@safestorage/vue';

const { value: theme, set: setTheme, ready } = useStorage('theme', 'light', {
  password: import.meta.env.VITE_STORAGE_KEY,
});
</script>

<template>
  <div v-if="ready">
    <p>Current theme: {{ theme }}</p>
    <button @click="setTheme('dark')">Go dark</button>
    <button @click="setTheme('light')">Go light</button>
  </div>
  <div v-else>Loading preferences...</div>
</template>
```

The `ready` ref flips to `true` after the initial async read — useful to avoid a flash of the default value on first render when there's a persisted value in storage.

### TTL

```ts
await set(token, { ttl: 30 * 60 * 1000 }); // expires in 30 minutes
```

### Config options

All options from `@safestorage/core`'s `SafeStorageConfig`:

```ts
useStorage('key', defaultValue, {
  password: '...',         // required
  namespace: 'feature::', // optional key prefix
  storage: 'session',     // 'local' (default) or 'session'
  ttl: 3600_000,          // global TTL in ms
  onError: (err) => ...,  // custom error handler
});
```

## License

MIT
