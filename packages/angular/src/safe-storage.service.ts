/**
 * SafeStorageService — Angular injectable for encrypted storage.
 *
 * @example — standalone / root-provided
 *   // app.config.ts
 *   import { provideSafeStorage } from '@safestorage/angular';
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
import { SafeStorage } from '@safestorage/core';
import type { SafeStorageConfig, SetOptions, ISafeStorage, StorageChangeListener } from '@safestorage/core';

export const SAFE_STORAGE_CONFIG = new InjectionToken<SafeStorageConfig>('SAFE_STORAGE_CONFIG');

@Injectable()
export class SafeStorageService implements ISafeStorage {
  private readonly storage: SafeStorage;

  constructor() {
    const config = inject(SAFE_STORAGE_CONFIG);
    this.storage = new SafeStorage(config);
  }

  set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    return this.storage.set(key, value, options);
  }

  get<T>(key: string, fallback?: T): Promise<T | undefined> {
    return this.storage.get(key, fallback);
  }

  remove(key: string): Promise<void> {
    return this.storage.remove(key);
  }

  clear(): Promise<void> {
    return this.storage.clear();
  }

  keys(): string[] {
    return this.storage.keys();
  }

  has(key: string): boolean {
    return this.storage.has(key);
  }

  onChange<T = unknown>(listener: StorageChangeListener<T>): () => void {
    return this.storage.onChange<T>(listener);
  }

  // ─── Signal-based API (Angular 16+) ─────────────────────────────────────────

  /**
   * Returns an Angular signal backed by an encrypted storage key.
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

  async setSignal<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.storage.set(key, value, options);
  }
}
