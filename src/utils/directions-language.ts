import {
  DEFAULT_DIRECTIONS_LANGUAGE,
  DIRECTIONS_LANGUAGE_STORAGE_KEY,
  type DirectionsLanguage,
  languageOptions,
} from '@/components/settings-panel/settings-options';

export function getDirectionsLanguage(): DirectionsLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_DIRECTIONS_LANGUAGE;
  }

  const stored = localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY);

  if (!stored) {
    return DEFAULT_DIRECTIONS_LANGUAGE;
  }

  const isValid = languageOptions.some((opt) => opt.value === stored);

  if (!isValid) {
    return DEFAULT_DIRECTIONS_LANGUAGE;
  }

  return stored as DirectionsLanguage;
}

export function setDirectionsLanguage(language: DirectionsLanguage): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, language);
}
