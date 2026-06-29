/**
 * SafeStorageService — Angular service for encrypted storage.
 *
 * Built as a plain class (no @Injectable decorator) so it works with Ivy AOT
 * without requiring ngc compilation. Register it via provideSafeStorage() or
 * SafeStorageModule.forRoot() — both use useFactory under the hood.
 *
 * @example — standalone app (app.config.ts)
 *   import { provideSafeStorage } from '@safestorage/angular';
 *
 *   export const appConfig: ApplicationConfig = {
 *     providers: [
 *       provideSafeStorage({ password: environment.storageKey, namespace: 'app::' }),
 *     ],
 *   };
 *
 *   // some.component.ts
 *   private readonly storage = inject(SafeStorageService);
 */

import { signal, type Signal, type OnDestroy } from '@angular/core';
import { SafeStorage } from '@safestorage/core';
import type { SafeStorageConfig, SetOptions, ISafeStorage, StorageChangeListener } from '@safestorage/core';

export class SafeStorageService implements ISafeStorage, OnDestroy {
  private readonly storage: SafeStorage;
  // Collect every onChange unsubscriber registered by toSignal() so they can
  // all be cleaned up when the injector that owns this service is destroyed.
  private readonly signalListeners: Array<() => void> = [];

  constructor(config: SafeStorageConfig) {
    this.storage = new SafeStorage(config);
  }

  ngOnDestroy(): void {
    for (const off of this.signalListeners) off();
    this.signalListeners.length = 0;
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

    const off = this.storage.onChange<T>((event) => {
      if (event.key !== key) return;
      if (event.type === 'set') {
        sig.set(event.newValue as T);
      } else if (event.type === 'remove' || event.type === 'expire') {
        sig.set(defaultValue);
      }
    });

    // Track the unsubscriber so ngOnDestroy can clean up all signal listeners.
    this.signalListeners.push(off);

    return sig.asReadonly();
  }

  async setSignal<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    await this.storage.set(key, value, options);
  }
}
