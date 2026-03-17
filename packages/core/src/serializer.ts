/**
 * Serialization layer between your TypeScript values and the raw strings
 * that encryption works with.
 *
 * This sits between the caller and the crypto layer, handling:
 *   - JSON serialization of arbitrary values
 *   - TTL envelope (wrapping values with an expiry timestamp)
 *   - TTL checking on read (expired entries are treated as missing)
 */

import type { StoredEntry } from './types.js';

/**
 * Wrap a value in a TTL envelope and serialize it to a JSON string
 * ready for encryption.
 *
 * @param value  The value to store. Must be JSON-serializable.
 * @param ttl    Time-to-live in milliseconds. Omit (or pass 0) for no expiry.
 */
export function serialize<T>(value: T, ttl?: number): string {
  const entry: StoredEntry<T> = { v: value };

  if (ttl && ttl > 0) {
    entry.exp = Date.now() + ttl;
  }

  return JSON.stringify(entry);
}

/**
 * Deserialize and unwrap a previously serialized entry.
 *
 * Returns `null` if:
 *   - The string is not valid JSON (corrupted storage)
 *   - The entry has expired
 *
 * Returning `null` lets the caller decide whether to fall back to a
 * default value or surface an error.
 */
export function deserialize<T>(raw: string): { value: T; expired: boolean } | null {
  let entry: StoredEntry<T>;

  try {
    entry = JSON.parse(raw) as StoredEntry<T>;
  } catch {
    return null;
  }

  if (!isStoredEntry(entry)) {
    return null;
  }

  if (entry.exp !== undefined && Date.now() > entry.exp) {
    return { value: entry.v, expired: true };
  }

  return { value: entry.v, expired: false };
}

/**
 * Check whether a deserialized entry is past its TTL without fully
 * deserializing the value. Useful for a lightweight `has()` check.
 */
export function isExpired(raw: string): boolean {
  try {
    const entry = JSON.parse(raw) as StoredEntry<unknown>;
    if (!isStoredEntry(entry)) return false;
    return entry.exp !== undefined && Date.now() > entry.exp;
  } catch {
    return false;
  }
}

function isStoredEntry<T>(value: unknown): value is StoredEntry<T> {
  return typeof value === 'object' && value !== null && 'v' in value;
}
