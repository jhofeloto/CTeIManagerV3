// CODECTI Platform - Auth Unit Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, signJWT, verifyJWT } from '../../src/utils/auth';

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it('should produce consistent hashes for the same password', async () => {
      const password = 'test123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'test123';
      const password2 = 'test456';
      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password Verification', () => {
    it('should verify correct password', async () => {
      const password = 'test123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'test123';
      const wrongPassword = 'wrong123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const password = '';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('JWT Operations', () => {
    const secret = 'test-secret-key';
    const testPayload = {
      userId: 1,
      email: 'test@codecti.choco.gov.co',
      role: 'admin' as const
    };

    it('should create a valid JWT token', async () => {
      const token = await signJWT(testPayload, secret);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature
    });

    it('should verify a valid JWT token', async () => {
      const token = await signJWT(testPayload, secret);
      const verified = await verifyJWT(token, secret);
      
      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(testPayload.userId);
      expect(verified?.email).toBe(testPayload.email);
      expect(verified?.role).toBe(testPayload.role);
      expect(verified?.exp).toBeGreaterThan(Date.now() / 1000);
    });

    it('should reject token with wrong secret', async () => {
      const token = await signJWT(testPayload, secret);
      const verified = await verifyJWT(token, 'wrong-secret');
      
      expect(verified).toBe(null);
    });

    it('should reject malformed token', async () => {
      const malformedToken = 'invalid.token.format';
      const verified = await verifyJWT(malformedToken, secret);
      
      expect(verified).toBe(null);
    });

    it('should include expiration time in token', async () => {
      const token = await signJWT(testPayload, secret);
      const verified = await verifyJWT(token, secret);
      
      expect(verified?.exp).toBeDefined();
      expect(verified?.iat).toBeDefined();
      expect(verified?.exp).toBeGreaterThan(verified?.iat!);
    });
  });
});