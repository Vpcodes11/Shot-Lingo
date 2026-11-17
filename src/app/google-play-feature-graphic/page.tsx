import type { Metadata } from "next";
import GuidePage from "@/components/GuidePage";

export const metadata: Metadata = {
  title: "Google Play feature graphic: size, rules and examples",
  description: "The Google Play feature graphic must be 1024×500 px, JPEG or 24-bit PNG with no transparency. Here is what to put on it and how to make one per language.",
  alternates: { canonical: "/google-play-feature-graphic" },
};

export default function Page() {
  return (
    <GuidePage
      title="Google Play feature graphic: size, rules and examples"
      intro="Every app on Google Play needs a feature graphic. It is the wide banner shown at the top of your listing and in promotions. Here is what Google requires and what tends to work."
    >
      <h2>Required size and format</h2>
      <ul>
        <li>Exactly <b>1024 × 500 px</b>.</li>
        <li>JPEG or 24-bit PNG, <b>no transparency</b>.</li>
        <li>It is required before you can publish a listing.</li>
      </ul>
      <h2>What to put on it</h2>
      <ul>
        <li>Your app name and one short benefit, large enough to read on a phone.</li>
        <li>A device showing your best screen, or a bold illustration.</li>
        <li>Keep important content away from the edges: Google may crop or overlay it, for example with a play button when you have a promo video.</li>
        <li>Avoid prices, rankings, or calls to action like “Download now”. Google&apos;s policies discourage them.</li>
      </ul>
      <h2>One per language</h2>
      <p>
        The feature graphic can be localized like screenshots. A banner in the visitor&apos;s own language looks more trustworthy than an English one, and
        it costs nothing extra once your captions are translated.
      </p>
      <p>Always check Google Play Console help for the latest requirements before publishing.</p>
    </GuidePage>
  );
}
