export { StorageProvider, useStorageContext } from './StorageProvider.js';
export { useStorage, useEncryptedState } from './useStorage.js';
export type { StorageProviderProps, } from './StorageProvider.js';
export type { UseStorageOptions, UseStorageReturn } from './useStorage.js';

// Re-export core types so consumers don't need a separate import
export type {
  SafeStorageConfig,
  SetOptions,
  ISafeStorage,
  StorageChangeEvent,
  StorageChangeListener,
} from '../../core/types.js';
