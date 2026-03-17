/**
 * StorageProvider — configure SafeStorage once at your app root and access the
 * shared instance anywhere via `useStorageContext()`.
 *
 * This is the recommended way to use SafeStorage in React. Configure the
 * password and options in one place, then call `useStorage` in any component
 * without passing config around.
 *
 * @example
 *   // main.tsx
 *   <StorageProvider password={import.meta.env.VITE_STORAGE_KEY} namespace="myapp::">
 *     <App />
 *   </StorageProvider>
 *
 *   // SomeComponent.tsx
 *   const [theme, setTheme] = useStorage('theme', 'light');
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { SafeStorage } from '../../core/storage.js';
import type { SafeStorageConfig } from '../../core/types.js';

interface StorageContextValue {
  storage: SafeStorage;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export interface StorageProviderProps extends SafeStorageConfig {
  children: ReactNode;
}

export function StorageProvider({ children, ...config }: StorageProviderProps) {
  const storage = useMemo(() => new SafeStorage(config), [
    // Rebuild the instance only when config identity changes.
    // In practice: keep these values stable (env vars, constants) to avoid
    // re-initializing storage on every render.
    config.password,
    config.namespace,
    config.storage,
    config.ttl,
  ]);

  return <StorageContext.Provider value={{ storage }}>{children}</StorageContext.Provider>;
}

/**
 * Returns the SafeStorage instance from the nearest StorageProvider.
 * Throws a clear error if called outside a provider tree.
 */
export function useStorageContext(): SafeStorage {
  const ctx = useContext(StorageContext);

  if (!ctx) {
    throw new Error(
      'useStorageContext: no StorageProvider found in the component tree. ' +
        'Wrap your app (or the relevant subtree) with <StorageProvider password="...">.',
    );
  }

  return ctx.storage;
}
