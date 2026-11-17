export interface Language {
  code: string;
  name: string;
  rtl?: boolean;
  // Scripts written without spaces between words: wrap per character.
  noSpaces?: boolean;
}

// App Store Connect localizations (plus Hindi etc. which Play supports).
export const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "fr", name: "French" },
  { code: "fr-CA", name: "French (Canada)" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" },
  { code: "sk", name: "Slovak" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "hr", name: "Croatian" },
  { code: "el", name: "Greek" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "uk", name: "Ukrainian" },
  { code: "ar", name: "Arabic", rtl: true },
  { code: "he", name: "Hebrew", rtl: true },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai", noSpaces: true },
  { code: "ja", name: "Japanese", noSpaces: true },
  { code: "ko", name: "Korean" },
  { code: "zh-Hans", name: "Chinese (Simplified)", noSpaces: true },
  { code: "zh-Hant", name: "Chinese (Traditional)", noSpaces: true },
  { code: "ca", name: "Catalan" },
  { code: "en-GB", name: "English (UK)" },
  { code: "en-AU", name: "English (Australia)" },
];

export const langByCode = (code: string): Language =>
  LANGUAGES.find((l) => l.code === code) ?? { code, name: code };
