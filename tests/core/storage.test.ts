import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SafeStorage, createStorage } from '../../src/core/storage.js';

const PASSWORD = 'test-password-for-tests';

function makeStorage(overrides?: Partial<ConstructorParameters<typeof SafeStorage>[0]>) {
  return new SafeStorage({ password: PASSWORD, ...overrides });
}

describe('SafeStorage constructor', () => {
  it('throws when password is missing', () => {
    expect(() => new SafeStorage({ password: '' })).toThrow('password');
  });

  it('defaults to localStorage', () => {
    const storage = makeStorage();
    expect(storage).toBeDefined();
  });

  it('can be configured to use sessionStorage', () => {
    const storage = makeStorage({ storage: 'session' });
    expect(storage).toBeDefined();
  });
});

describe('set and get', () => {
  it('stores and retrieves a string', async () => {
    const storage = makeStorage();
    await storage.set('name', 'Alice');
    const result = await storage.get<string>('name');
    expect(result).toBe('Alice');
  });

  it('stores and retrieves an object', async () => {
    const storage = makeStorage();
    const obj = { id: 1, name: 'Bob', active: true };
    await storage.set('user', obj);
    const result = await storage.get<typeof obj>('user');
    expect(result).toEqual(obj);
  });

  it('stores and retrieves a number', async () => {
    const storage = makeStorage();
    await storage.set('count', 42);
    const result = await storage.get<number>('count');
    expect(result).toBe(42);
  });

  it('stores and retrieves an array', async () => {
    const storage = makeStorage();
    await storage.set('items', [1, 2, 3]);
    const result = await storage.get<number[]>('items');
    expect(result).toEqual([1, 2, 3]);
  });

  it('stores and retrieves null', async () => {
    const storage = makeStorage();
    await storage.set('nothing', null);
    const result = await storage.get('nothing');
    expect(result).toBeNull();
  });

  it('returns undefined for a missing key', async () => {
    const storage = makeStorage();
    const result = await storage.get('does-not-exist');
    expect(result).toBeUndefined();
  });

  it('returns the fallback for a missing key', async () => {
    const storage = makeStorage();
    const result = await storage.get('missing', 'default');
    expect(result).toBe('default');
  });

  it('overwrites an existing value', async () => {
    const storage = makeStorage();
    await storage.set('key', 'first');
    await storage.set('key', 'second');
    expect(await storage.get('key')).toBe('second');
  });
});

describe('namespacing', () => {
  it('prefixes keys with the namespace', async () => {
    const storage = makeStorage({ namespace: 'app::' });
    await storage.set('theme', 'dark');

    const raw = localStorage.getItem('app::theme');
    expect(raw).not.toBeNull();
    expect(localStorage.getItem('theme')).toBeNull();
  });

  it('two instances with different namespaces do not interfere', async () => {
    const s1 = makeStorage({ namespace: 'alpha::' });
    const s2 = makeStorage({ namespace: 'beta::' });

    await s1.set('key', 'from-alpha');
    await s2.set('key', 'from-beta');

    expect(await s1.get('key')).toBe('from-alpha');
    expect(await s2.get('key')).toBe('from-beta');
  });
});

describe('TTL', () => {
  it('returns fallback for an expired entry', async () => {
    vi.useFakeTimers();
    const storage = makeStorage();

    await storage.set('expires-soon', 'value', { ttl: 1000 });

    vi.advanceTimersByTime(1001);

    const result = await storage.get('expires-soon', 'gone');
    expect(result).toBe('gone');

    vi.useRealTimers();
  });

  it('returns the value before it expires', async () => {
    vi.useFakeTimers();
    const storage = makeStorage();

    await storage.set('not-yet', 'still here', { ttl: 5000 });

    vi.advanceTimersByTime(4000);

    expect(await storage.get('not-yet')).toBe('still here');

    vi.useRealTimers();
  });

  it('removes the key from storage after expiry', async () => {
    vi.useFakeTimers();
    const storage = makeStorage({ namespace: 'ttl::' });

    await storage.set('temp', 'data', { ttl: 500 });
    vi.advanceTimersByTime(600);

    await storage.get('temp');
    expect(localStorage.getItem('ttl::temp')).toBeNull();

    vi.useRealTimers();
  });

  it('per-item TTL overrides the global default', async () => {
    vi.useFakeTimers();
    const storage = makeStorage({ ttl: 10_000 });

    await storage.set('override', 'value', { ttl: 500 });
    vi.advanceTimersByTime(600);

    expect(await storage.get('override')).toBeUndefined();

    vi.useRealTimers();
  });
});

describe('remove', () => {
  it('removes a key', async () => {
    const storage = makeStorage();
    await storage.set('to-delete', 'bye');
    await storage.remove('to-delete');
    expect(await storage.get('to-delete')).toBeUndefined();
  });

  it('does nothing for a non-existent key', async () => {
    const storage = makeStorage();
    await expect(storage.remove('ghost')).resolves.not.toThrow();
  });
});

describe('clear', () => {
  it('removes all keys in the namespace', async () => {
    const storage = makeStorage({ namespace: 'clear-test::' });
    await storage.set('a', 1);
    await storage.set('b', 2);
    await storage.set('c', 3);

    await storage.clear();

    expect(await storage.get('a')).toBeUndefined();
    expect(await storage.get('b')).toBeUndefined();
    expect(await storage.get('c')).toBeUndefined();
  });

  it('does not remove keys from a different namespace', async () => {
    const s1 = makeStorage({ namespace: 'keep::' });
    const s2 = makeStorage({ namespace: 'nuke::' });

    await s1.set('safe', 'yes');
    await s2.set('target', 'bye');

    await s2.clear();

    expect(await s1.get('safe')).toBe('yes');
  });
});

describe('keys and has', () => {
  it('lists all managed keys (unprefixed)', async () => {
    const storage = makeStorage({ namespace: 'keys-test::' });
    await storage.set('x', 1);
    await storage.set('y', 2);

    const k = storage.keys();
    expect(k).toContain('x');
    expect(k).toContain('y');
  });

  it('has() returns true for existing keys', async () => {
    const storage = makeStorage();
    await storage.set('present', true);
    expect(storage.has('present')).toBe(true);
  });

  it('has() returns false for missing keys', () => {
    const storage = makeStorage();
    expect(storage.has('absent')).toBe(false);
  });
});

describe('onChange events', () => {
  it('emits a "set" event when a value is written', async () => {
    const storage = makeStorage();
    const listener = vi.fn();
    storage.onChange(listener);

    await storage.set('watched', 'hello');

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'set', key: 'watched', newValue: 'hello' }),
    );
  });

  it('emits a "remove" event when a value is deleted', async () => {
    const storage = makeStorage();
    const listener = vi.fn();
    storage.onChange(listener);

    await storage.set('tmp', 1);
    await storage.remove('tmp');

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'remove', key: 'tmp' }),
    );
  });

  it('emits a "clear" event when cleared', async () => {
    const storage = makeStorage({ namespace: 'event-clear::' });
    const listener = vi.fn();
    storage.onChange(listener);

    await storage.clear();

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'clear', key: null }),
    );
  });

  it('unsubscribes correctly', async () => {
    const storage = makeStorage();
    const listener = vi.fn();
    const off = storage.onChange(listener);

    off();
    await storage.set('after-unsub', 'value');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('error handling', () => {
  it('calls onError and returns fallback when decryption fails due to wrong password', async () => {
    const errorHandler = vi.fn();

    // Write with one password
    const writer = new SafeStorage({ password: 'correct', namespace: 'err-test::' });
    await writer.set('secret', 'data');

    // Read with a different password
    const reader = new SafeStorage({
      password: 'wrong',
      namespace: 'err-test::',
      onError: errorHandler,
    });

    const result = await reader.get('secret', 'fallback');

    expect(result).toBe('fallback');
    expect(errorHandler).toHaveBeenCalled();
  });
});

describe('createStorage factory', () => {
  it('returns a SafeStorage instance', () => {
    const storage = createStorage({ password: 'factory-test' });
    expect(storage).toBeInstanceOf(SafeStorage);
  });
});
