/**
 * Core types for SafeStorage.
 *
 * These are deliberately lean — the goal is an API that's easy to understand
 * at a glance, not one that requires reading docs before writing a single line.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/**
 * Options passed when creating a SafeStorage instance.
 */
export interface SafeStorageConfig {
  /**
   * The passphrase used to derive the encryption key via PBKDF2.
   * Treat this like a password: keep it out of source control and
   * consider pulling it from an environment variable at runtime.
   */
  password: string;

  /**
   * Optional prefix applied to every key written to storage.
   * Useful for scoping data to a feature, route, or user session
   * without colliding with other keys.
   *
   * @example "dashboard::" → stored as "dashboard::theme"
   */
  namespace?: string;

  /**
   * Which Web Storage backend to use.
   * - `"local"` persists across browser restarts (default)
   * - `"session"` is wiped when the tab closes
   */
  storage?: 'local' | 'session';

  /**
   * Global default TTL in milliseconds applied to every `set()` call
   * unless overridden at the item level.
   * Items past their TTL are treated as missing and silently removed.
   */
  ttl?: number;

  /**
   * Called when an internal error occurs (e.g. decryption fails,
   * storage quota exceeded). Defaults to `console.error`.
   * Provide your own handler to route errors to Sentry, Datadog, etc.
   */
  onError?: (err: Error) => void;
}

// ─── Per-operation options ────────────────────────────────────────────────────

/**
 * Options accepted by `SafeStorage.set()`.
 */
export interface SetOptions {
  /**
   * Override the instance-level TTL for this specific item.
   * Pass `0` to explicitly store with no expiry, even if a global
   * TTL is configured on the instance.
   */
  ttl?: number;
}

// ─── Internal wire format ─────────────────────────────────────────────────────

/**
 * The JSON structure stored inside each encrypted payload.
 * Keys are deliberately short to keep the ciphertext compact.
 */
export interface StoredEntry<T> {
  /** The actual value */
  v: T;
  /** Unix timestamp (ms) at which this entry expires. Omitted if no TTL. */
  exp?: number;
}

/**
 * The encrypted blob written to localStorage / sessionStorage.
 * Both fields are base64-encoded.
 */
export interface EncryptedPayload {
  /** Initialisation vector (96-bit, base64) */
  iv: string;
  /** AES-GCM ciphertext (base64) */
  ct: string;
  /** PBKDF2 salt (base64). Stored alongside each entry so we never reuse salts. */
  salt: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

/**
 * Emitted by the internal event emitter whenever a key is written, removed,
 * or expires during a read.
 */
export type StorageEventType = 'set' | 'remove' | 'expire' | 'clear';

export interface StorageChangeEvent<T = unknown> {
  type: StorageEventType;
  key: string | null;
  /** New value (only present for "set" events) */
  newValue?: T;
  /** Previous value if it was readable before the change */
  oldValue?: T;
}

export type StorageChangeListener<T = unknown> = (event: StorageChangeEvent<T>) => void;

// ─── Instance API ─────────────────────────────────────────────────────────────

/**
 * The public interface every SafeStorage instance satisfies.
 * Useful for mocking in tests without importing the concrete class.
 */
export interface ISafeStorage {
  set<T>(key: string, value: T, options?: SetOptions): Promise<void>;
  get<T>(key: string, fallback?: T): Promise<T | undefined>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): string[];
  has(key: string): boolean;
  onChange<T = unknown>(listener: StorageChangeListener<T>): () => void;
}
