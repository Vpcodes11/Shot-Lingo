import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy">
      <p>Last updated: November 2026. Have this reviewed by a lawyer before launch; it describes how the service works today.</p>
      <h2>Who we are</h2>
      <p>{SITE.name} (“we”) provides an online tool for creating app store screenshots. Contact: {SITE.supportEmail}.</p>
      <h2>What stays on your device</h2>
      <p>Your screenshots, captions and project settings are stored in your browser (IndexedDB) and rendered on your device. We do not upload your full-size screenshots to our servers.</p>
      <h2>What we collect</h2>
      <ul className="ml-5 list-disc space-y-1">
        <li><b>Account:</b> if you sign in, your email address and sign-in timestamps (stored with our database and authentication provider, Supabase).</li>
        <li><b>Purchases:</b> plan, status and renewal dates received from our payment provider, Lemon Squeezy, which acts as merchant of record. We never see your card details.</li>
        <li><b>AI features:</b> when you use AI captions, downscaled screenshots plus your app name and description are sent to our AI provider (Anthropic) to generate text. Captions are sent the same way for translation and listing text. We do not store this content after the response is returned.</li>
        <li><b>Usage limits and security:</b> daily counters keyed by account or IP address, and standard server logs from our host (Vercel).</li>
        <li><b>Analytics:</b> privacy-friendly, cookie-less page analytics (Vercel Analytics).</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use only essential cookies to keep you signed in.</p>
      <h2>Your rights</h2>
      <p>You can access, correct or delete your account data at any time by emailing {SITE.supportEmail}. Clearing your browser&apos;s site data deletes local projects. These rights include those under the GDPR and UK GDPR.</p>
    </LegalPage>
  );
}
