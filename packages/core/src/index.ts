export { SafeStorage, createStorage } from './storage.js';

export type {
  SafeStorageConfig,
  SetOptions,
  ISafeStorage,
  StoredEntry,
  EncryptedPayload,
  StorageEventType,
  StorageChangeEvent,
  StorageChangeListener,
} from './types.js';

export { encrypt, decrypt, deriveKey } from './crypto.js';
