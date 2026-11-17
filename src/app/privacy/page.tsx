import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>Last updated: November 2026. Review this with a lawyer before launch; it describes how the app works today.</p>
      <h2>What stays on your device</h2>
      <p>Your screenshots, captions and project settings are stored in your browser (IndexedDB) and rendered on your device. We do not upload your full-size screenshots to our servers.</p>
      <h2>What we process</h2>
      <p>When you click “Write captions with AI”, a downscaled copy of each screenshot plus your app name and description are sent to our server and to our AI provider (Anthropic) to generate captions. When you translate, your captions are sent the same way. We do not store this content after the response is returned.</p>
      <p>When you activate a license, the key is checked with our payment provider (Lemon Squeezy). Payments are handled entirely by the payment provider; we never see card details.</p>
      <p>Our hosting provider keeps standard server logs (such as IP address and request time) for security and abuse prevention.</p>
      <h2>Your rights</h2>
      <p>You can delete all local data by clearing your browser&apos;s site data. For any request about personal data (including GDPR and UK GDPR requests), email {SITE.supportEmail}.</p>
    </LegalPage>
  );
}
