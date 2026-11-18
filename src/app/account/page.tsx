import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { getViewer } from "@/lib/server/billing";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Account", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "");

export default async function Account({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer.user) redirect("/login?next=/account");
  const sub = viewer.active;

  let planLine = "Free plan";
  let detail = "3 screenshots, 1 language, watermark on exports.";
  if (viewer.pro && sub?.kind === "lifetime") {
    planLine = "Pro · Lifetime";
    detail = "Paid once. Yours for good.";
  } else if (viewer.pro && sub) {
    planLine = `Pro · ${sub.plan_name ?? "Subscription"}`;
    if (sub.status === "cancelled") detail = `Cancelled. Pro stays active until ${fmt(sub.ends_at)}.`;
    else if (sub.status === "past_due") detail = "Your last payment failed. Update your card to keep Pro.";
    else if (sub.status === "on_trial") detail = `Trial. First payment on ${fmt(sub.renews_at)}.`;
    else detail = `Renews on ${fmt(sub.renews_at)}.`;
  } else if (viewer.pro) {
    planLine = "Pro";
    detail = "Complimentary access.";
  } else if (sub && sub.status === "expired") {
    detail = "Your Pro subscription has ended. Upgrade again any time.";
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
        <Link href="/" className="font-bold">{SITE.name}</Link>
        <Link href="/app" className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Open editor</Link>
      </nav>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-3xl font-extrabold">Account</h1>
        {sp.error === "checkout" && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Checkout is not set up yet. Please contact {SITE.supportEmail}.</p>
        )}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Signed in as</p>
          <p className="font-semibold">{viewer.user.email}</p>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-500">Plan</p>
          <p className="text-xl font-bold">{planLine}</p>
          <p className="mt-1 text-neutral-600">{detail}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {viewer.pro && sub ? (
              <>
                {sub.kind === "subscription" && (
                  <a href="/api/billing/portal" className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white">
                    Manage billing &amp; invoices
                  </a>
                )}
                {sub.status === "past_due" && sub.update_payment_url && (
                  <a href={sub.update_payment_url} className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold">
                    Update card
                  </a>
                )}
              </>
            ) : !viewer.pro ? (
              <>
                <a href="/api/checkout?plan=monthly" className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold">$12 / month</a>
                <a href="/api/checkout?plan=yearly" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">$79 / year</a>
                <a href="/api/checkout?plan=lifetime" className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold">$49 lifetime</a>
              </>
            ) : null}
          </div>
        </section>
        <section className="flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-neutral-600">Questions or refunds: <a className="underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></p>
          <form action="/auth/signout" method="post">
            <button className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100">Sign out</button>
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
