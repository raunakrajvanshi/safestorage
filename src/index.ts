/**
 * safestorage — core entry point.
 *
 * This exports only the framework-agnostic core. For framework-specific
 * hooks and utilities, import from the dedicated entry points:
 *
 *   import { useStorage } from 'safestorage/react';
 *   import { useStorage } from 'safestorage/vue';
 *   import { SafeStorageService } from 'safestorage/angular';
 */

export { SafeStorage, createStorage } from './core/storage.js';

export type {
  SafeStorageConfig,
  SetOptions,
  ISafeStorage,
  StoredEntry,
  EncryptedPayload,
  StorageEventType,
  StorageChangeEvent,
  StorageChangeListener,
} from './core/types.js';

// Lower-level crypto utilities — available for advanced use cases or if you
// need to encrypt data outside of the SafeStorage class.
export { encrypt, decrypt, deriveKey } from './core/crypto.js';
