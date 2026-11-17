import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

export const metadata: Metadata = {
  title: "How to localize App Store screenshots (step by step)",
  description: "Why localized App Store and Google Play screenshots matter, which languages to start with, and how to translate captions and export every size without redoing the design.",
  alternates: { canonical: "/localize-app-store-screenshots" },
};

export default function Page() {
  return (
    <GuidePage
      title="How to localize App Store screenshots"
      intro="Most people decide whether to download from your screenshots, not your description. If they read English captions in a German or Japanese store, many scroll past. Localizing screenshots is one of the cheapest growth levers for an app."
    >
      <h2>1. Pick your first languages</h2>
      <p>Check App Store Connect and Play Console for the countries that already bring you impressions. Common high-value starting points:</p>
      <ul>
        <li>Spanish (Spain and Latin America), Portuguese (Brazil), German, French, Japanese</li>
        <li>Then Korean, Italian, Turkish, Indonesian, Simplified Chinese and Arabic, depending on your audience</li>
      </ul>
      <h2>2. Write captions that survive translation</h2>
      <ul>
        <li>Keep headlines to about 5 words. German and French often run 30% longer than English.</li>
        <li>Lead with a benefit (“Plan your day in seconds”), not a feature name.</li>
        <li>Avoid puns and idioms. They rarely translate.</li>
      </ul>
      <h2>3. Translate like a copywriter, not a dictionary</h2>
      <p>Literal translations sound off to native speakers. Ask for marketing copy in each language, keep it short enough to fit, and keep your app name untranslated.</p>
      <h2>4. Localize the listing text too</h2>
      <p>On the App Store, the subtitle and keyword field are indexed per language. Localized keywords are how people in that market find you in search.</p>
      <h2>5. Export every size for every language</h2>
      <p>
        Each language needs its own set of screenshots in every device size you support. That is often hundreds of images, which is why most teams use a
        template-based tool or fastlane instead of exporting by hand from a design tool.
      </p>
      <h2>6. Upload</h2>
      <p>
        Upload in App Store Connect and Play Console per language, or use <b>fastlane deliver</b> and <b>fastlane supply</b> to upload all languages at
        once from a folder structure.
      </p>
    </GuidePage>
  );
}
