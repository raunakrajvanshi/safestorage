import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { StorageProvider } from '../src/StorageProvider.js';
import { useStorage, useEncryptedState } from '../src/useStorage.js';

const PASSWORD = 'react-test-password';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <StorageProvider password={PASSWORD} namespace="react-test::">
      {children}
    </StorageProvider>
  );
}

describe('useStorage', () => {
  it('returns the default value initially', () => {
    const { result } = renderHook(() => useStorage('key', 'default'), { wrapper });
    expect(result.current[0]).toBe('default');
  });

  it('persists and retrieves a value', async () => {
    const { result } = renderHook(() => useStorage('persist-key', ''), { wrapper });

    await act(async () => {
      await result.current[1]('stored-value');
    });

    const { result: result2 } = renderHook(() => useStorage('persist-key', ''), { wrapper });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result2.current[0]).toBe('stored-value');
  });

  it('removes the value and resets to default', async () => {
    const { result } = renderHook(() => useStorage('remove-key', 'start'), { wrapper });

    await act(async () => {
      await result.current[1]('something');
    });

    await act(async () => {
      await result.current[2]();
    });

    expect(result.current[0]).toBe('start');
  });

  it('accepts a function updater', async () => {
    const { result } = renderHook(() => useStorage('counter', 0), { wrapper });

    await act(async () => {
      await result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('throws when no provider and no password option', () => {
    expect(() => {
      renderHook(() => useStorage('key', 'default'));
    }).toThrow(/StorageProvider|password/);
  });

  it('works standalone with password option', async () => {
    const { result } = renderHook(() =>
      useStorage('standalone-key', 'none', {
        password: 'standalone-pass',
        namespace: 'standalone::',
      }),
    );

    await act(async () => {
      await result.current[1]('standalone-value');
    });

    expect(result.current[0]).toBe('standalone-value');
  });
});

describe('useEncryptedState', () => {
  it('behaves like useState', async () => {
    const { result } = renderHook(() => useEncryptedState('state-key-2', 0), { wrapper });

    act(() => {
      result.current[1](5);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(5);
    }, { timeout: 3000 });
  });

  it('supports functional updates', async () => {
    const { result } = renderHook(() => useEncryptedState('fn-update-key-2', 10), { wrapper });

    act(() => {
      result.current[1]((prev) => prev + 5);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(15);
    }, { timeout: 3000 });
  });
});
