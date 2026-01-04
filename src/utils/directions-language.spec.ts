import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDirectionsLanguage,
  setDirectionsLanguage,
} from './directions-language';
import {
  DEFAULT_DIRECTIONS_LANGUAGE,
  DIRECTIONS_LANGUAGE_STORAGE_KEY,
} from '@/components/settings-panel/settings-options';

describe('directions-language', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { language: 'en-US' });
  });

  afterEach(() => {
    localStorage.clear();
    vi.stubGlobal('navigator', originalNavigator);
  });

  describe('getDirectionsLanguage', () => {
    it('should return system language when localStorage is empty and locale is supported', () => {
      vi.stubGlobal('navigator', { language: 'de-DE' });
      expect(getDirectionsLanguage()).toBe('de-DE');
    });

    it('should return default language when localStorage is empty and locale is not supported', () => {
      vi.stubGlobal('navigator', { language: 'xx-XX' });
      expect(getDirectionsLanguage()).toBe(DEFAULT_DIRECTIONS_LANGUAGE);
    });

    it('should match partial locale when exact match not found', () => {
      vi.stubGlobal('navigator', { language: 'fr-CA' });
      expect(getDirectionsLanguage()).toBe('fr-FR');
    });

    it('should return stored language when valid', () => {
      localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, 'de-DE');
      expect(getDirectionsLanguage()).toBe('de-DE');
    });

    it('should return system language when stored value is invalid', () => {
      vi.stubGlobal('navigator', { language: 'es-ES' });
      localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, 'invalid-lang');
      expect(getDirectionsLanguage()).toBe('es-ES');
    });

    it('should return stored language for all supported languages', () => {
      const supportedLanguages = [
        'bg-BG',
        'ca-ES',
        'cs-CZ',
        'da-DK',
        'de-DE',
        'el-GR',
        'en-GB',
        'en-US',
        'en-US-x-pirate',
        'es-ES',
        'et-EE',
        'fi-FI',
        'fr-FR',
        'hi-IN',
        'hu-HU',
        'it-IT',
        'ja-JP',
        'nb-NO',
        'nl-NL',
        'pl-PL',
        'pt-BR',
        'pt-PT',
        'ro-RO',
        'ru-RU',
        'sk-SK',
        'sl-SI',
        'sv-SE',
        'tr-TR',
        'uk-UA',
      ];

      for (const lang of supportedLanguages) {
        localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, lang);
        expect(getDirectionsLanguage()).toBe(lang);
      }
    });
  });

  describe('setDirectionsLanguage', () => {
    it('should save language to localStorage', () => {
      setDirectionsLanguage('fr-FR');
      expect(localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY)).toBe(
        'fr-FR'
      );
    });

    it('should overwrite existing language in localStorage', () => {
      setDirectionsLanguage('de-DE');
      expect(localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY)).toBe(
        'de-DE'
      );

      setDirectionsLanguage('es-ES');
      expect(localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY)).toBe(
        'es-ES'
      );
    });

    it('should allow setting the default language', () => {
      setDirectionsLanguage('tr-TR');
      setDirectionsLanguage(DEFAULT_DIRECTIONS_LANGUAGE);
      expect(localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY)).toBe(
        DEFAULT_DIRECTIONS_LANGUAGE
      );
    });
  });

  describe('integration', () => {
    it('should get what was set', () => {
      setDirectionsLanguage('ja-JP');
      expect(getDirectionsLanguage()).toBe('ja-JP');
    });

    it('should persist across calls', () => {
      setDirectionsLanguage('nl-NL');
      expect(getDirectionsLanguage()).toBe('nl-NL');
      expect(getDirectionsLanguage()).toBe('nl-NL');
    });
  });
});
