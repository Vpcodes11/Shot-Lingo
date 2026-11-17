export type DeviceKind = "ios-phone" | "ios-tablet" | "android-phone" | "android-tablet" | "feature-graphic";

export interface ExportSize {
  id: string;
  store: "App Store" | "Google Play";
  label: string;
  width: number;
  height: number;
  device: DeviceKind;
  note: string;
  defaultOn: boolean;
  // Folder names used by fastlane deliver (iOS) / supply (Android).
  fastlane: { platform: "ios" | "android"; folder: string };
}

// Portrait sizes accepted by App Store Connect and Google Play Console.
// Always double-check the official docs before a release: stores change requirements.
export const SIZES: ExportSize[] = [
  { id: "iphone-6.9", store: "App Store", label: 'iPhone 6.9"', width: 1320, height: 2868, device: "ios-phone", note: "Required for iPhone apps. Apple scales it down for smaller iPhones.", defaultOn: true, fastlane: { platform: "ios", folder: "" } },
  { id: "iphone-6.5", store: "App Store", label: 'iPhone 6.5"', width: 1284, height: 2778, device: "ios-phone", note: "Optional. Older large iPhones (11 Pro Max, XS Max).", defaultOn: true, fastlane: { platform: "ios", folder: "" } },
  { id: "iphone-6.3", store: "App Store", label: 'iPhone 6.3"', width: 1206, height: 2622, device: "ios-phone", note: "Optional. iPhone 16 / 16 Pro and newer standard models.", defaultOn: false, fastlane: { platform: "ios", folder: "" } },
  { id: "iphone-5.5", store: "App Store", label: 'iPhone 5.5"', width: 1242, height: 2208, device: "ios-phone", note: "Optional. Home-button iPhones (8 Plus).", defaultOn: false, fastlane: { platform: "ios", folder: "" } },
  { id: "ipad-13", store: "App Store", label: 'iPad 13"', width: 2064, height: 2752, device: "ios-tablet", note: "Required if your app runs on iPad.", defaultOn: true, fastlane: { platform: "ios", folder: "" } },
  { id: "ipad-12.9", store: "App Store", label: 'iPad Pro 12.9"', width: 2048, height: 2732, device: "ios-tablet", note: "Optional. Older iPad Pro models.", defaultOn: false, fastlane: { platform: "ios", folder: "" } },
  { id: "android-phone", store: "Google Play", label: "Android phone", width: 1080, height: 1920, device: "android-phone", note: "Required: 2–8 phone screenshots, 9:16.", defaultOn: true, fastlane: { platform: "android", folder: "phoneScreenshots" } },
  { id: "android-7", store: "Google Play", label: 'Android 7" tablet', width: 1200, height: 1920, device: "android-tablet", note: "Recommended for tablet visibility on Play.", defaultOn: false, fastlane: { platform: "android", folder: "sevenInchScreenshots" } },
  { id: "android-10", store: "Google Play", label: 'Android 10" tablet', width: 1600, height: 2560, device: "android-tablet", note: "Recommended for tablet visibility on Play.", defaultOn: false, fastlane: { platform: "android", folder: "tenInchScreenshots" } },
  { id: "play-feature", store: "Google Play", label: "Feature graphic", width: 1024, height: 500, device: "feature-graphic", note: "Required for every Play listing. One per language, uses screen 1's caption.", defaultOn: true, fastlane: { platform: "android", folder: "featureGraphic" } },
];

export const sizeById = (id: string) => SIZES.find((s) => s.id === id) ?? SIZES[0];
