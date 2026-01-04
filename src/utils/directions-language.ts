import {
  DEFAULT_DIRECTIONS_LANGUAGE,
  DIRECTIONS_LANGUAGE_STORAGE_KEY,
  type DirectionsLanguage,
  languageOptions,
} from '@/components/settings-panel/settings-options';

function getSystemLanguage(): DirectionsLanguage {
  if (typeof navigator === 'undefined') {
    return DEFAULT_DIRECTIONS_LANGUAGE;
  }

  const systemLocale = navigator.language;

  const exactMatch = languageOptions.find((opt) => opt.value === systemLocale);

  if (exactMatch) {
    return exactMatch.value;
  }

  const baseLocale = systemLocale.split('-')[0];
  const partialMatch = languageOptions.find(
    (opt) => opt.value.split('-')[0] === baseLocale
  );

  if (partialMatch) {
    return partialMatch.value;
  }

  return DEFAULT_DIRECTIONS_LANGUAGE;
}

export function getDirectionsLanguage(): DirectionsLanguage {
  if (typeof window === 'undefined') {
    return DEFAULT_DIRECTIONS_LANGUAGE;
  }

  const stored = localStorage.getItem(DIRECTIONS_LANGUAGE_STORAGE_KEY);

  if (!stored) {
    return getSystemLanguage();
  }

  const isValid = languageOptions.some((opt) => opt.value === stored);

  if (!isValid) {
    return getSystemLanguage();
  }

  return stored as DirectionsLanguage;
}

export function setDirectionsLanguage(language: DirectionsLanguage): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(DIRECTIONS_LANGUAGE_STORAGE_KEY, language);
}
