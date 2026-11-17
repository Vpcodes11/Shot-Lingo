import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { BILLING_PORTAL, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

// Set this page as the "redirect after purchase" URL in Lemon Squeezy.
export default function Thanks() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-extrabold">Thank you for buying {SITE.name} Pro</h1>
        <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left text-neutral-700">
          <li><b>1.</b> Check your email for the receipt. It contains your <b>license key</b>.</li>
          <li><b>2.</b> Open the editor and paste the key into <b>Upgrade → Activate</b>.</li>
          <li><b>3.</b> Add languages, translate, and export without a watermark.</li>
        </ol>
        <Link href="/app?upgrade=1" className="mt-8 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">
          Activate my license
        </Link>
        <p className="mt-6 text-sm text-neutral-500">
          No email after 10 minutes? Check spam, find your key in{" "}
          <a href={BILLING_PORTAL} className="underline" target="_blank" rel="noopener">your orders</a>, or write to{" "}
          <a href={`mailto:${SITE.supportEmail}`} className="underline">{SITE.supportEmail}</a>.
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
