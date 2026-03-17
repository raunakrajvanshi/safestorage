/**
 * SafeStorage — the main class you interact with.
 *
 * Every value that passes through here is encrypted before touching
 * localStorage/sessionStorage and decrypted on the way back out.
 * From the outside it looks like a slightly async version of localStorage.
 *
 * Usage:
 *
 *   const storage = new SafeStorage({ password: 'my-app-secret' });
 *
 *   await storage.set('user', { id: 1, name: 'Alice' });
 *   const user = await storage.get('user');
 *   await storage.remove('user');
 */

import { encrypt, decrypt } from './crypto.js';
import { serialize, deserialize } from './serializer.js';
import type {
  SafeStorageConfig,
  SetOptions,
  ISafeStorage,
  StorageChangeEvent,
  StorageChangeListener,
  EncryptedPayload,
} from './types.js';

export class SafeStorage implements ISafeStorage {
  private readonly password: string;
  private readonly namespace: string;
  private readonly backend: Storage;
  private readonly defaultTtl: number | undefined;
  private readonly onError: (err: Error) => void;
  private readonly listeners: Set<StorageChangeListener<unknown>> = new Set();

  constructor(config: SafeStorageConfig) {
    if (!config.password) {
      throw new Error('SafeStorage: `password` is required and cannot be empty.');
    }

    this.password = config.password;
    this.namespace = config.namespace ?? '';
    this.defaultTtl = config.ttl;
    this.onError = config.onError ?? ((err) => console.error('[SafeStorage]', err));

    if (config.storage === 'session') {
      this.backend = globalThis.sessionStorage;
    } else {
      this.backend = globalThis.localStorage;
    }

    if (!this.backend) {
      throw new Error(
        'SafeStorage: Web Storage is not available in this environment. ' +
          'SafeStorage is designed for browser contexts.',
      );
    }
  }

  // ─── Key helpers ────────────────────────────────────────────────────────────

  private prefixKey(key: string): string {
    return this.namespace ? `${this.namespace}${key}` : key;
  }

  private unprefixKey(rawKey: string): string | null {
    if (!this.namespace) return rawKey;
    if (!rawKey.startsWith(this.namespace)) return null;
    return rawKey.slice(this.namespace.length);
  }

  // ─── Core API ───────────────────────────────────────────────────────────────

  /**
   * Encrypt and persist a value.
   *
   * @param key     Storage key (namespace is prepended automatically).
   * @param value   Any JSON-serializable value.
   * @param options Per-item TTL override and other write options.
   *
   * @example
   *   await storage.set('preferences', { theme: 'dark' }, { ttl: 3600_000 });
   */
  async set<T>(key: string, value: T, options?: SetOptions): Promise<void> {
    const ttl = options?.ttl !== undefined ? options.ttl : this.defaultTtl;
    let oldValue: T | undefined;

    try {
      oldValue = await this.get<T>(key);
    } catch {
      // ignore — we just won't include an oldValue in the event
    }

    try {
      const plaintext = serialize(value, ttl);
      const payload = await encrypt(plaintext, this.password);
      this.backend.setItem(this.prefixKey(key), JSON.stringify(payload));

      this.emit({ type: 'set', key, newValue: value, oldValue });
    } catch (err) {
      this.onError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * Retrieve and decrypt a value.
   *
   * Returns `fallback` (default: `undefined`) when the key doesn't exist,
   * can't be decrypted, or has expired.
   *
   * @example
   *   const theme = await storage.get('theme', 'light');
   */
  async get<T>(key: string, fallback?: T): Promise<T | undefined> {
    const raw = this.backend.getItem(this.prefixKey(key));

    if (raw === null) {
      return fallback;
    }

    try {
      const payload = JSON.parse(raw) as EncryptedPayload;
      const plaintext = await decrypt(payload, this.password);
      const result = deserialize<T>(plaintext);

      if (result === null) {
        return fallback;
      }

      if (result.expired) {
        this.backend.removeItem(this.prefixKey(key));
        this.emit({ type: 'expire', key, oldValue: result.value });
        return fallback;
      }

      return result.value;
    } catch (err) {
      this.onError(err instanceof Error ? err : new Error(String(err)));
      return fallback;
    }
  }

  /**
   * Remove a single key.
   *
   * Silent no-op if the key doesn't exist.
   */
  async remove(key: string): Promise<void> {
    let oldValue: unknown;

    try {
      oldValue = await this.get(key);
    } catch {
      // ignore
    }

    this.backend.removeItem(this.prefixKey(key));
    this.emit({ type: 'remove', key, oldValue });
  }

  /**
   * Remove all keys that belong to this instance's namespace.
   *
   * If no namespace is configured, this clears **all** keys in the storage
   * backend — so think twice before calling it without one.
   */
  async clear(): Promise<void> {
    const keysToRemove = this.keys();

    keysToRemove.forEach((key) => {
      this.backend.removeItem(this.prefixKey(key));
    });

    this.emit({ type: 'clear', key: null });
  }

  /**
   * Returns the list of unprefixed keys managed by this instance.
   * Keys belonging to other namespaces (or plain localStorage) are excluded.
   */
  keys(): string[] {
    const result: string[] = [];

    for (let i = 0; i < this.backend.length; i++) {
      const rawKey = this.backend.key(i);
      if (rawKey === null) continue;

      const unprefixed = this.unprefixKey(rawKey);
      if (unprefixed !== null) {
        result.push(unprefixed);
      }
    }

    return result;
  }

  /**
   * Returns `true` if the key exists in storage, regardless of whether it's
   * expired. Use `get()` and check for `undefined` if you care about TTL.
   */
  has(key: string): boolean {
    return this.backend.getItem(this.prefixKey(key)) !== null;
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  /**
   * Subscribe to storage changes made through this instance.
   *
   * Returns an unsubscribe function — call it when you're done (e.g. in a
   * `useEffect` cleanup or `ngOnDestroy`).
   *
   * @example
   *   const off = storage.onChange((event) => {
   *     console.log(event.type, event.key, event.newValue);
   *   });
   *   // later...
   *   off();
   */
  onChange<T = unknown>(listener: StorageChangeListener<T>): () => void {
    this.listeners.add(listener as StorageChangeListener<unknown>);
    return () => {
      this.listeners.delete(listener as StorageChangeListener<unknown>);
    };
  }

  private emit(event: StorageChangeEvent<unknown>): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        this.onError(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }
}

/**
 * Convenience factory so you don't have to write `new SafeStorage(...)` every
 * time. Especially handy when you're creating a singleton module.
 *
 * @example
 *   export const storage = createStorage({ password: process.env.STORAGE_KEY });
 */
export function createStorage(config: SafeStorageConfig): SafeStorage {
  return new SafeStorage(config);
}
