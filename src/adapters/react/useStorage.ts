/**
 * useStorage — the main React hook for encrypted storage.
 *
 * Behaves like `useState` but persists the value to encrypted localStorage
 * (or sessionStorage) and syncs across browser tabs automatically.
 *
 * @example
 *   // Inside StorageProvider:
 *   const [user, setUser, removeUser] = useStorage('user', null);
 *
 *   // Standalone (bring your own config):
 *   const [theme, setTheme] = useStorage('theme', 'light', {
 *     password: import.meta.env.VITE_KEY,
 *     namespace: 'prefs::',
 *   });
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { SafeStorage } from '../../core/storage.js';
import type { SafeStorageConfig, SetOptions } from '../../core/types.js';
import { useStorageContext } from './StorageProvider.js';

export type UseStorageOptions = SafeStorageConfig & SetOptions;

export type UseStorageReturn<T> = [
  value: T,
  setValue: (value: T | ((prev: T) => T), options?: SetOptions) => Promise<void>,
  removeValue: () => Promise<void>,
];

/**
 * Hook that reads/writes an encrypted value in storage and keeps the React
 * state in sync.
 *
 * @param key           Storage key (namespaced by the provider if used).
 * @param defaultValue  Returned while the value loads, and for missing keys.
 * @param options       Pass SafeStorageConfig here when using standalone
 *                      (i.e. outside a StorageProvider).
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: UseStorageOptions,
): UseStorageReturn<T> {
  const contextStorage = tryUseContext();
  const standaloneStorage = useRef<SafeStorage | null>(null);

  // Resolve which storage instance to use — context-provided or standalone.
  const storage: SafeStorage = (() => {
    if (contextStorage) return contextStorage;

    if (options?.password) {
      if (!standaloneStorage.current) {
        standaloneStorage.current = new SafeStorage(options);
      }
      return standaloneStorage.current;
    }

    throw new Error(
      'useStorage: no StorageProvider found and no `password` option passed. ' +
        'Either wrap your app in <StorageProvider> or pass `password` directly to useStorage.',
    );
  })();

  const [value, setInternalValue] = useState<T>(defaultValue);
  const [initialized, setInitialized] = useState(false);
  // Track whether setValue was called before the initial load completes.
  // If it was, we skip overwriting the optimistic update with stale storage data.
  const setCalledBeforeInit = useRef(false);

  // Load the initial value from storage
  useEffect(() => {
    let cancelled = false;
    setCalledBeforeInit.current = false;

    storage.get<T>(key, defaultValue).then((stored) => {
      if (!cancelled) {
        if (!setCalledBeforeInit.current) {
          setInternalValue(stored as T);
        }
        setInitialized(true);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Sync across tabs via the native storage event
  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      // We don't know what namespace/key mapping is used, so we do a
      // full re-read whenever any storage key changes.
      if (event.storageArea !== localStorage && event.storageArea !== sessionStorage) return;

      storage.get<T>(key, defaultValue).then((stored) => {
        setInternalValue(stored as T);
      });
    }

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Subscribe to in-process changes (same tab, different component)
  useEffect(() => {
    return storage.onChange<T>((event) => {
      if (event.key === key && event.type === 'set') {
        setInternalValue(event.newValue as T);
      }
      if (event.key === key && (event.type === 'remove' || event.type === 'expire')) {
        setInternalValue(defaultValue);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setValue = useCallback(
    async (valueOrUpdater: T | ((prev: T) => T), writeOptions?: SetOptions) => {
      const nextValue =
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (prev: T) => T)(value)
          : valueOrUpdater;

      setCalledBeforeInit.current = true;
      setInternalValue(nextValue);
      await storage.set(key, nextValue, writeOptions);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, value],
  );

  const removeValue = useCallback(async () => {
    setInternalValue(defaultValue);
    await storage.remove(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Return defaultValue until the first async read resolves
  return [initialized ? value : defaultValue, setValue, removeValue] as const as UseStorageReturn<T>;
}

/**
 * A dispatcher-style hook that mimics `useState` exactly.
 * The only difference is that the state is transparently persisted.
 *
 * @example
 *   const [count, setCount] = useEncryptedState('counter', 0);
 *   setCount(c => c + 1);  // works exactly like useState
 */
export function useEncryptedState<T>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useStorage<T>(key, initialValue, options);

  const dispatch: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      if (typeof action === 'function') {
        void setValue((action as (prev: T) => T)(value));
      } else {
        void setValue(action);
      }
    },
    [value, setValue],
  );

  return [value, dispatch];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Attempt to read from StorageContext without throwing if it doesn't exist.
 * React's rules of hooks say you can't call hooks conditionally, but reading
 * context safely in a try/catch is fine — context reads are synchronous.
 */
function tryUseContext(): SafeStorage | null {
  try {
    // This will throw if there's no provider, which we handle below.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStorageContext();
  } catch {
    return null;
  }
}
