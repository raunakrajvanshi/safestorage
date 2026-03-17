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
import { SafeStorage } from '@safestorage/core';
import type { SafeStorageConfig, SetOptions } from '@safestorage/core';
import { useStorageContext } from './StorageProvider.js';

export type UseStorageOptions = SafeStorageConfig & SetOptions;

export type UseStorageReturn<T> = [
  value: T,
  setValue: (value: T | ((prev: T) => T), options?: SetOptions) => Promise<void>,
  removeValue: () => Promise<void>,
];

export function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: UseStorageOptions,
): UseStorageReturn<T> {
  const contextStorage = tryUseContext();
  const standaloneStorage = useRef<SafeStorage | null>(null);

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
  const setCalledBeforeInit = useRef(false);

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

  useEffect(() => {
    function handleStorageEvent(event: StorageEvent) {
      if (event.storageArea !== localStorage && event.storageArea !== sessionStorage) return;
      storage.get<T>(key, defaultValue).then((stored) => {
        setInternalValue(stored as T);
      });
    }

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

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

  return [initialized ? value : defaultValue, setValue, removeValue] as const as UseStorageReturn<T>;
}

/**
 * Drop-in replacement for `useState` that auto-persists to encrypted storage.
 *
 * @example
 *   const [count, setCount] = useEncryptedState('counter', 0);
 *   setCount(c => c + 1);
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

function tryUseContext(): SafeStorage | null {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStorageContext();
  } catch {
    return null;
  }
}
