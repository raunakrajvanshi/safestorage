/**
 * SafeStorageService — Angular injectable for encrypted storage.
 *
 * Wrap the service in your module or provide it at the root level, then
 * inject it wherever you need encrypted persistence.
 *
 * Supports both class-based Angular and the modern signal-based approach.
 *
 * @example — standalone / root-provided
 *   // app.config.ts
 *   import { provideSafeStorage } from 'safestorage/angular';
 *
 *   export const appConfig: ApplicationConfig = {
 *     providers: [
 *       provideSafeStorage({ password: environment.storageKey, namespace: 'app::' }),
 *     ],
 *   };
 *
 *   // some.component.ts
 *   constructor(private storage: SafeStorageService) {}
 *
 *   async saveUser(user: User) {
 *     await this.storage.set('user', user);
 *   }
 */

import { Injectable, InjectionToken, inject, signal, type Signal } from '@angular/core';
import { SafeStorage } from '../../core/storage.js';
import type { SafeStorageConfig, SetOptions, ISafeStorage, StorageChangeListener } from '../../core/types.js';

// ─── Config token ─────────────────────────────────────────────────────────────

export const SAFE_STORAGE_CONFIG = new InjectionToken<SafeStorageConfig>('SAFE_STORAGE_CONFIG');

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SafeStorageService implements ISafeStorage {
  private readonly storage: SafeStorage;

  constructor() {
    const config = inject(SAFE_STORAGE_CONFIG);
    this.storage = new SafeStorage(config);
  }

  /**
   * Encrypt and persist a value.
   *
   * @example await this.storage.set('cart', cartItems, { ttl: 86400_000 });
   */
  set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    return this.storage.set(key, value, options);
  }

  /**
   * Retrieve and decrypt a value.
   * Returns `fallback` (or `undefined`) if the key is missing or expired.
   *
   * @example const cart = await this.storage.get<CartItem[]>('cart', []);
   */
  get<T>(key: string, fallback?: T): Promise<T | undefined> {
    return this.storage.get(key, fallback);
  }

  /** Remove a single key. Silent no-op for missing keys. */
  remove(key: string): Promise<void> {
    return this.storage.remove(key);
  }

  /** Remove all keys in this service's namespace. */
  clear(): Promise<void> {
    return this.storage.clear();
  }

  /** Returns the unprefixed list of keys this service manages. */
  keys(): string[] {
    return this.storage.keys();
  }

  /** Returns `true` if the key exists in storage (regardless of TTL). */
  has(key: string): boolean {
    return this.storage.has(key);
  }

  /**
   * Subscribe to storage changes. Returns an unsubscribe function.
   * Call it inside `ngOnDestroy` to avoid memory leaks.
   *
   * @example
   *   const off = this.storage.onChange(event => this.handleChange(event));
   *   // in ngOnDestroy:
   *   off();
   */
  onChange<T = unknown>(listener: StorageChangeListener<T>): () => void {
    return this.storage.onChange<T>(listener);
  }

  // ─── Signal-based API (Angular 16+) ─────────────────────────────────────────

  /**
   * Returns an Angular signal backed by an encrypted storage key.
   * The signal is initialized to `defaultValue` and updated asynchronously
   * once the first read completes.
   *
   * Changes made via `setSignal()` are written to encrypted storage
   * and reflected in the signal immediately.
   *
   * @example
   *   readonly theme = this.storage.toSignal('theme', 'light');
   *   this.storage.setSignal('theme', 'dark');
   */
  toSignal<T>(key: string, defaultValue: T): Signal<T> {
    const sig = signal<T>(defaultValue);

    this.storage.get<T>(key, defaultValue).then((value) => {
      sig.set(value as T);
    });

    this.storage.onChange<T>((event) => {
      if (event.key !== key) return;

      if (event.type === 'set') {
        sig.set(event.newValue as T);
      } else if (event.type === 'remove' || event.type === 'expire') {
        sig.set(defaultValue);
      }
    });

    return sig.asReadonly();
  }

  /**
   * Write a new value for a signal-backed key.
   * Pairs with `toSignal()`.
   */
  async setSignal<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.storage.set(key, value, options);
  }
}
