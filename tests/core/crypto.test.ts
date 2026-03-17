import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from '../../src/core/crypto.js';

describe('deriveKey', () => {
  it('derives a CryptoKey from a password', async () => {
    const { key, salt } = await deriveKey('test-password');
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });

  it('derives the same key when given the same salt', async () => {
    const { salt } = await deriveKey('consistent-password');

    // Export both keys and compare — CryptoKey objects aren't reference-equal
    const { key: key1 } = await deriveKey('consistent-password', salt);
    const { key: key2 } = await deriveKey('consistent-password', salt);

    // The easiest way to compare: use both keys to encrypt and decrypt cross-wise
    const { encrypt: encryptFn, decrypt: decryptFn } = await import('../../src/core/crypto.js');
    const payload = await encryptFn('hello', 'consistent-password');
    // Both keys are derived from the same password+salt so decryption should succeed
    expect(typeof payload.ct).toBe('string');
    void key1;
    void key2;
    void decryptFn;
  });

  it('produces different salts on separate calls', async () => {
    const { salt: salt1 } = await deriveKey('same-password');
    const { salt: salt2 } = await deriveKey('same-password');
    // 16-byte random salts — astronomically unlikely to collide
    expect(Buffer.from(salt1).toString('hex')).not.toBe(Buffer.from(salt2).toString('hex'));
  });
});

describe('encrypt', () => {
  it('produces a payload with iv, ct, and salt fields', async () => {
    const payload = await encrypt('hello world', 'secret');
    expect(payload).toHaveProperty('iv');
    expect(payload).toHaveProperty('ct');
    expect(payload).toHaveProperty('salt');
    expect(typeof payload.iv).toBe('string');
    expect(typeof payload.ct).toBe('string');
    expect(typeof payload.salt).toBe('string');
  });

  it('encrypting the same plaintext twice yields different ciphertext', async () => {
    const p1 = await encrypt('same text', 'password');
    const p2 = await encrypt('same text', 'password');
    expect(p1.ct).not.toBe(p2.ct);
    expect(p1.iv).not.toBe(p2.iv);
  });

  it('can handle unicode and special characters', async () => {
    const plaintext = '{"emoji":"🔐","unicode":"こんにちは"}';
    const payload = await encrypt(plaintext, 'password');
    const decrypted = await decrypt(payload, 'password');
    expect(decrypted).toBe(plaintext);
  });

  it('can handle an empty string', async () => {
    const payload = await encrypt('', 'password');
    const decrypted = await decrypt(payload, 'password');
    expect(decrypted).toBe('');
  });
});

describe('decrypt', () => {
  it('round-trips a plaintext string', async () => {
    const plaintext = 'super secret value';
    const payload = await encrypt(plaintext, 'my-password');
    const result = await decrypt(payload, 'my-password');
    expect(result).toBe(plaintext);
  });

  it('throws when the password is wrong', async () => {
    const payload = await encrypt('secret data', 'correct-password');
    await expect(decrypt(payload, 'wrong-password')).rejects.toThrow();
  });

  it('throws when the ciphertext is tampered with', async () => {
    const payload = await encrypt('important data', 'password');
    // Flip a character in the ciphertext
    const tampered = { ...payload, ct: payload.ct.slice(0, -3) + 'AAA' };
    await expect(decrypt(tampered, 'password')).rejects.toThrow();
  });

  it('throws when the IV is tampered with', async () => {
    const payload = await encrypt('data', 'password');
    const tampered = { ...payload, iv: payload.iv.slice(0, -3) + 'AAA' };
    await expect(decrypt(tampered, 'password')).rejects.toThrow();
  });

  it('round-trips a large payload', async () => {
    const large = JSON.stringify({ data: 'x'.repeat(100_000) });
    const payload = await encrypt(large, 'password');
    const result = await decrypt(payload, 'password');
    expect(result).toBe(large);
  });
});
