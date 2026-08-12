export interface LanguageOption {
  code: string
  label: string
}

export const AUTO_LANGUAGE = 'auto'

/** Naming a language beats detection, and English is the safest opening guess. */
export const DEFAULT_LANGUAGE = 'en'

/** A short list up front; Whisper itself supports ~99 languages. */
export const LANGUAGES: LanguageOption[] = [
  { code: AUTO_LANGUAGE, label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'pl', label: 'Polish' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
]
