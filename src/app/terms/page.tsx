import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of service" };

export default function Terms() {
  return (
    <LegalPage title="Terms of service">
      <p>Last updated: November 2026. Review this with a lawyer before launch.</p>
      <h2>The service</h2>
      <p>{SITE.name} helps you create marketing screenshots for app stores. You keep all rights to the screenshots and text you upload and the images you export.</p>
      <h2>Your content</h2>
      <p>Only upload content you have the right to use. Do not use the service for unlawful, misleading or infringing material. Check AI-written captions and translations before publishing them; you are responsible for what you publish.</p>
      <h2>Plans and payments</h2>
      <p>Paid plans are sold through our payment provider, which acts as merchant of record. Subscriptions renew until cancelled and can be cancelled at any time; access continues until the end of the paid period. Lifetime licenses give access to Pro features for as long as the service operates. Fair-use limits apply to AI features.</p>
      <h2>Refunds</h2>
      <p>If {SITE.name} doesn&apos;t work for you, email {SITE.supportEmail} within 14 days of purchase for a refund.</p>
      <h2>Liability</h2>
      <p>The service is provided “as is”. Store requirements change; always check your exports against Apple&apos;s and Google&apos;s current guidelines. To the extent allowed by law, our liability is limited to the amount you paid in the last 12 months.</p>
      <h2>Contact</h2>
      <p>{SITE.supportEmail}</p>
    </LegalPage>
  );
}
