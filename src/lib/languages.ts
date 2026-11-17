export interface Language {
  code: string;
  name: string;
  rtl?: boolean;
  // Scripts written without spaces between words: wrap per character.
  noSpaces?: boolean;
  // Locale codes used by App Store Connect / fastlane deliver and Google Play / fastlane supply.
  asc?: string;
  play?: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English (US)", asc: "en-US", play: "en-US" },
  { code: "en-GB", name: "English (UK)", asc: "en-GB", play: "en-GB" },
  { code: "en-AU", name: "English (Australia)", asc: "en-AU", play: "en-AU" },
  { code: "es", name: "Spanish (Spain)", asc: "es-ES", play: "es-ES" },
  { code: "es-MX", name: "Spanish (Latin America)", asc: "es-MX", play: "es-419" },
  { code: "fr", name: "French", asc: "fr-FR", play: "fr-FR" },
  { code: "fr-CA", name: "French (Canada)", asc: "fr-CA", play: "fr-CA" },
  { code: "de", name: "German", asc: "de-DE", play: "de-DE" },
  { code: "it", name: "Italian", asc: "it", play: "it-IT" },
  { code: "pt-BR", name: "Portuguese (Brazil)", asc: "pt-BR", play: "pt-BR" },
  { code: "pt-PT", name: "Portuguese (Portugal)", asc: "pt-PT", play: "pt-PT" },
  { code: "nl", name: "Dutch", asc: "nl-NL", play: "nl-NL" },
  { code: "sv", name: "Swedish", asc: "sv", play: "sv-SE" },
  { code: "da", name: "Danish", asc: "da", play: "da-DK" },
  { code: "no", name: "Norwegian", asc: "no", play: "no-NO" },
  { code: "fi", name: "Finnish", asc: "fi", play: "fi-FI" },
  { code: "pl", name: "Polish", asc: "pl", play: "pl-PL" },
  { code: "cs", name: "Czech", asc: "cs", play: "cs-CZ" },
  { code: "sk", name: "Slovak", asc: "sk", play: "sk" },
  { code: "hu", name: "Hungarian", asc: "hu", play: "hu-HU" },
  { code: "ro", name: "Romanian", asc: "ro", play: "ro" },
  { code: "hr", name: "Croatian", asc: "hr", play: "hr" },
  { code: "el", name: "Greek", asc: "el", play: "el-GR" },
  { code: "tr", name: "Turkish", asc: "tr", play: "tr-TR" },
  { code: "ru", name: "Russian", asc: "ru", play: "ru-RU" },
  { code: "uk", name: "Ukrainian", asc: "uk", play: "uk" },
  { code: "ar", name: "Arabic", rtl: true, asc: "ar-SA", play: "ar" },
  { code: "he", name: "Hebrew", rtl: true, asc: "he", play: "iw-IL" },
  { code: "hi", name: "Hindi", asc: "hi", play: "hi-IN" },
  { code: "bn", name: "Bengali", play: "bn-BD" },
  { code: "ta", name: "Tamil", play: "ta-IN" },
  { code: "id", name: "Indonesian", asc: "id", play: "id" },
  { code: "ms", name: "Malay", asc: "ms", play: "ms" },
  { code: "vi", name: "Vietnamese", asc: "vi", play: "vi" },
  { code: "th", name: "Thai", noSpaces: true, asc: "th", play: "th" },
  { code: "ja", name: "Japanese", noSpaces: true, asc: "ja", play: "ja-JP" },
  { code: "ko", name: "Korean", asc: "ko", play: "ko-KR" },
  { code: "zh-Hans", name: "Chinese (Simplified)", noSpaces: true, asc: "zh-Hans", play: "zh-CN" },
  { code: "zh-Hant", name: "Chinese (Traditional)", noSpaces: true, asc: "zh-Hant", play: "zh-TW" },
  { code: "ca", name: "Catalan", asc: "ca", play: "ca" },
];

export const langByCode = (code: string): Language =>
  LANGUAGES.find((l) => l.code === code) ?? { code, name: code };
