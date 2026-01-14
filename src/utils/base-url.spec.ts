import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getBaseUrl,
  setBaseUrl,
  getDefaultBaseUrl,
  validateBaseUrl,
  normalizeBaseUrl,
  testConnection,
} from './base-url';

const STORAGE_KEY = 'valhalla_base_url';
const TEST_CUSTOM_URL = 'https://custom.valhalla.com';

describe('base-url', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDefaultBaseUrl', () => {
    it('should return the environment variable value', () => {
      const defaultUrl = getDefaultBaseUrl();
      expect(defaultUrl).toBeTruthy();
      expect(typeof defaultUrl).toBe('string');
    });
  });

  describe('getBaseUrl', () => {
    it('should return default URL when localStorage is empty', () => {
      const defaultUrl = getDefaultBaseUrl();
      expect(getBaseUrl()).toBe(defaultUrl);
    });

    it('should return stored URL when present in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, TEST_CUSTOM_URL);
      expect(getBaseUrl()).toBe(TEST_CUSTOM_URL);
    });
  });

  describe('setBaseUrl', () => {
    it('should store URL in localStorage', () => {
      setBaseUrl(TEST_CUSTOM_URL);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(TEST_CUSTOM_URL);
    });

    it('should remove from localStorage when URL matches default', () => {
      const defaultUrl = getDefaultBaseUrl();
      localStorage.setItem(STORAGE_KEY, TEST_CUSTOM_URL);
      setBaseUrl(defaultUrl);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should remove from localStorage when URL is empty', () => {
      localStorage.setItem(STORAGE_KEY, TEST_CUSTOM_URL);
      setBaseUrl('');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should trim whitespace from URL', () => {
      setBaseUrl('  ' + TEST_CUSTOM_URL + '  ');
      expect(localStorage.getItem(STORAGE_KEY)).toBe(TEST_CUSTOM_URL);
    });
  });

  describe('validateBaseUrl', () => {
    it('should return invalid for empty string', () => {
      const result = validateBaseUrl('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    it('should return invalid for whitespace only', () => {
      const result = validateBaseUrl('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    it('should return invalid for malformed URL', () => {
      const result = validateBaseUrl('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should return invalid for non-http protocols', () => {
      const result = validateBaseUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL must use HTTP or HTTPS protocol');
    });

    it('should return invalid for javascript protocol', () => {
      const result = validateBaseUrl('javascript:alert(1)');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('URL must use HTTP or HTTPS protocol');
    });

    it('should return valid for http URL', () => {
      const result = validateBaseUrl('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for https URL', () => {
      const result = validateBaseUrl('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for URL with port', () => {
      const result = validateBaseUrl('https://example.com:8080');
      expect(result.valid).toBe(true);
    });

    it('should return valid for URL with path', () => {
      const result = validateBaseUrl('https://example.com/api/v1');
      expect(result.valid).toBe(true);
    });
  });

  describe('normalizeBaseUrl', () => {
    it('should remove trailing slash', () => {
      expect(normalizeBaseUrl('https://example.com/')).toBe(
        'https://example.com'
      );
    });

    it('should not modify URL without trailing slash', () => {
      expect(normalizeBaseUrl('https://example.com')).toBe(
        'https://example.com'
      );
    });

    it('should trim whitespace', () => {
      expect(normalizeBaseUrl('  https://example.com  ')).toBe(
        'https://example.com'
      );
    });

    it('should handle URL with path and trailing slash', () => {
      expect(normalizeBaseUrl('https://example.com/api/')).toBe(
        'https://example.com/api'
      );
    });
  });

  describe('testConnection', () => {
    it('should return invalid for malformed URL', async () => {
      const result = await testConnection('not-a-url');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should return unreachable when fetch fails', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await testConnection('https://unreachable.example.com');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Server unreachable');
    });

    it('should return unreachable on timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      vi.spyOn(global, 'fetch').mockRejectedValue(abortError);

      const result = await testConnection('https://slow.example.com');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Connection timeout');
    });

    it('should return unreachable for non-ok status', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await testConnection('https://error.example.com');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Server returned status 500');
    });

    it('should return error for invalid JSON response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response);

      const result = await testConnection('https://invalid-json.example.com');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Invalid response format');
    });

    it('should return error when available_actions is missing', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: '3.6.1' }),
      } as unknown as Response);

      const result = await testConnection('https://not-valhalla.example.com');
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Not a valid Valhalla server');
    });

    it('should return error when available_actions is not an array', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ available_actions: 'route' }),
      } as unknown as Response);

      const result = await testConnection(
        'https://invalid-actions.example.com'
      );
      expect(result.reachable).toBe(false);
      expect(result.error).toBe('Not a valid Valhalla server');
    });

    it('should return error when required actions are missing', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ available_actions: ['status', 'locate'] }),
      } as unknown as Response);

      const result = await testConnection(
        'https://missing-actions.example.com'
      );
      expect(result.reachable).toBe(false);
      expect(result.error).toBe(
        'Server missing required actions (route, isochrone)'
      );
    });

    it('should return reachable for valid Valhalla server', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            version: '3.6.1',
            available_actions: ['route', 'isochrone', 'status', 'locate'],
          }),
      } as unknown as Response);

      const result = await testConnection('https://valid.example.com');
      expect(result.reachable).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should normalize URL before testing', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            version: '3.6.1',
            available_actions: ['route', 'isochrone'],
          }),
      } as unknown as Response);

      await testConnection('https://example.com/');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://example.com/status',
        expect.any(Object)
      );
    });
  });
});
