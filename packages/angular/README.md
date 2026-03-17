# @safestorage/angular

Angular service and module for encrypted localStorage/sessionStorage. Backed by `@safestorage/core` — install this package and you get both.

## Installation

```bash
npm i @safestorage/angular
```

Peer dependency: `@angular/core >= 14`

## Standalone apps (Angular 15+)

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideSafeStorage } from '@safestorage/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideSafeStorage({
      password: environment.storageKey,
      namespace: 'myapp::',
    }),
  ],
};
```

## NgModule apps

```ts
// app.module.ts
import { SafeStorageModule } from '@safestorage/angular';

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

Feature modules with a different namespace:

```ts
SafeStorageModule.forChild({ password: '...', namespace: 'feature::' })
```

## Injecting the service

```ts
import { Component, OnDestroy } from '@angular/core';
import { SafeStorageService } from '@safestorage/angular';

@Component({ ... })
export class CartComponent implements OnDestroy {
  private off: () => void;

  constructor(private storage: SafeStorageService) {
    this.off = this.storage.onChange(event => {
      if (event.key === 'cart') this.reload();
    });
  }

  async saveCart(items: CartItem[]) {
    await this.storage.set('cart', items, { ttl: 86400_000 }); // 24h
  }

  async loadCart(): Promise<CartItem[]> {
    return (await this.storage.get<CartItem[]>('cart')) ?? [];
  }

  ngOnDestroy() {
    this.off(); // unsubscribe to avoid memory leaks
  }
}
```

## Signals (Angular 16+)

`toSignal()` binds an encrypted storage key to an Angular signal. The signal stays in sync with storage changes made from anywhere in the app.

```ts
@Component({ ... })
export class ThemeComponent {
  readonly theme: Signal<string>;

  constructor(private storage: SafeStorageService) {
    // Reads from storage asynchronously; starts with the default
    this.theme = this.storage.toSignal('theme', 'light');
  }

  toggleTheme() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    void this.storage.setSignal('theme', next);
  }
}
```

## Full API

| Method | Description |
|---|---|
| `set<T>(key, value, options?)` | Encrypt and persist |
| `get<T>(key, fallback?)` | Decrypt and return; fallback on miss/expiry |
| `remove(key)` | Delete a key |
| `clear()` | Remove all keys in this service's namespace |
| `has(key)` | Synchronous existence check |
| `keys()` | List all managed (unprefixed) keys |
| `onChange(listener)` | Subscribe to changes; returns unsubscribe fn |
| `toSignal(key, default)` | Signal-based API |
| `setSignal(key, value)` | Write for signal-backed keys |

## License

MIT
