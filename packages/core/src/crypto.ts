/**
 * Cryptographic primitives for SafeStorage.
 *
 * Everything here leans on the browser's built-in Web Crypto API — no
 * third-party crypto library, no dependencies, no surprises.
 *
 * Choices made (and why):
 *
 * - **AES-GCM 256-bit** for symmetric encryption. GCM provides both
 *   confidentiality and authenticity (AEAD), so we get tamper detection
 *   for free without bolting on a separate MAC.
 *
 * - **PBKDF2 with SHA-256, 310,000 iterations** for key derivation. The
 *   iteration count matches OWASP's current recommendation and makes
 *   brute-force attacks expensive. The key is re-derived per operation
 *   (with a fresh random salt) so that two items encrypted with the same
 *   password produce completely different ciphertext.
 *
 * - **Random 96-bit IV** for every encryption call. GCM's security
 *   guarantee breaks down if an IV is reused with the same key — using a
 *   fresh random IV each time sidesteps that entirely.
 */

import type { EncryptedPayload } from './types.js';

const PBKDF2_ITERATIONS = 310_000;
const KEY_LENGTH = 256;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCrypto(): SubtleCrypto {
  const subtle =
    typeof globalThis.crypto !== 'undefined'
      ? globalThis.crypto.subtle
      : undefined;

  if (!subtle) {
    throw new Error(
      'SafeStorage requires the Web Crypto API (SubtleCrypto). ' +
        'This is available in all modern browsers and Node 16+.',
    );
  }
  return subtle;
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(
    atob(str)
      .split('')
      .map((c) => c.charCodeAt(0)),
  ) as Uint8Array<ArrayBuffer>;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length) as Uint8Array<ArrayBuffer>;
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

// ─── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derive an AES-GCM CryptoKey from a human-readable password.
 *
 * A fresh random salt is generated on every call and returned alongside the
 * key so it can be stored with the ciphertext for later decryption.
 */
export async function deriveKey(
  password: string,
  existingSalt?: Uint8Array<ArrayBuffer>,
): Promise<{ key: CryptoKey; salt: Uint8Array<ArrayBuffer> }> {
  const subtle = getCrypto();
  const salt = existingSalt ?? randomBytes(16);

  const passwordKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const key = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );

  return { key, salt };
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with the given password.
 *
 * Returns a self-contained `EncryptedPayload` with everything needed to
 * decrypt later: the IV, the salt, and the ciphertext — all base64-encoded.
 */
export async function encrypt(plaintext: string, password: string): Promise<EncryptedPayload> {
  const subtle = getCrypto();
  const { key, salt } = await deriveKey(password);
  const iv = randomBytes(12);

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return {
    iv: toBase64(iv.buffer as ArrayBuffer),
    ct: toBase64(ciphertext),
    salt: toBase64(salt.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt a payload produced by `encrypt()`.
 *
 * Throws if the ciphertext has been tampered with (GCM authentication tag
 * mismatch) or if the password is wrong. Callers should catch and handle.
 */
export async function decrypt(payload: EncryptedPayload, password: string): Promise<string> {
  const subtle = getCrypto();
  const salt = fromBase64(payload.salt);
  const { key } = await deriveKey(password, salt);
  const iv = fromBase64(payload.iv);
  const ciphertext = fromBase64(payload.ct);

  const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

  return new TextDecoder().decode(plaintext);
}
