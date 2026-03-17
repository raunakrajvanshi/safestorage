/**
 * useStorage — Vue 3 composable for encrypted storage.
 *
 * Returns a reactive ref that's automatically backed by encrypted
 * localStorage (or sessionStorage). Writing to `value.value` persists and
 * encrypts; reading from it gives you the decrypted, typed result.
 *
 * @example
 *   const { value: theme, set: setTheme, remove: resetTheme, ready } = useStorage('theme', 'light', {
 *     password: import.meta.env.VITE_STORAGE_KEY,
 *   });
 */

import { ref, readonly, onUnmounted, type Ref } from 'vue';
import { SafeStorage } from '@safestorage/core';
import type { SafeStorageConfig, SetOptions } from '@safestorage/core';

export interface UseStorageOptions extends SafeStorageConfig {
  defaultWriteTtl?: number;
}

export interface UseStorageReturn<T> {
  /** Reactive, read-only reference to the current value. */
  value: Readonly<Ref<T>>;
  /** Write a new value (encrypts and persists). */
  set: (value: T, options?: SetOptions) => Promise<void>;
  /** Remove the key from storage and reset to the default. */
  remove: () => Promise<void>;
  /** `true` once the initial async read from storage has completed. */
  ready: Readonly<Ref<boolean>>;
}

export function useStorage<T>(
  key: string,
  defaultValue: T,
  options: UseStorageOptions,
): UseStorageReturn<T> {
  const storage = new SafeStorage(options);
  const internalValue = ref<T>(defaultValue) as Ref<T>;
  const ready = ref(false);

  storage.get<T>(key, defaultValue).then((stored) => {
    internalValue.value = stored as T;
    ready.value = true;
  });

  function handleStorageEvent(event: StorageEvent) {
    if (event.storageArea !== localStorage && event.storageArea !== sessionStorage) return;
    storage.get<T>(key, defaultValue).then((stored) => {
      internalValue.value = stored as T;
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageEvent);
  }

  const offChange = storage.onChange<T>((event) => {
    if (event.key === key && event.type === 'set') {
      internalValue.value = event.newValue as T;
    }
    if (event.key === key && (event.type === 'remove' || event.type === 'expire')) {
      internalValue.value = defaultValue;
    }
  });

  onUnmounted(() => {
    offChange();
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorageEvent);
    }
  });

  async function set(value: T, writeOptions?: SetOptions): Promise<void> {
    internalValue.value = value;
    await storage.set(key, value, writeOptions);
  }

  async function remove(): Promise<void> {
    internalValue.value = defaultValue;
    await storage.remove(key);
  }

  return {
    value: readonly(internalValue) as Readonly<Ref<T>>,
    set,
    remove,
    ready: readonly(ready),
  };
}
