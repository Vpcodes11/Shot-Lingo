import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import ThanksStatus from "@/components/ThanksStatus";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

// Set https://YOUR-DOMAIN/thanks as the "redirect after purchase" URL in Lemon Squeezy.
export default function Thanks() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="mt-4 text-3xl font-extrabold">Thank you for buying {SITE.name} Pro</h1>
        <ThanksStatus />
        <p className="mt-10 text-sm text-neutral-500">
          Your receipt is on its way by email. Questions: <a href={`mailto:${SITE.supportEmail}`} className="underline">{SITE.supportEmail}</a>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
