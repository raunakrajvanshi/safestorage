import { vi } from 'vitest';

// happy-dom ships with a working SubtleCrypto implementation, but just in case
// a test environment doesn't have it, we can shim here in the future.

// Reset localStorage between tests so state doesn't bleed across suites.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});
