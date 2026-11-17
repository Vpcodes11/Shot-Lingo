import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { SIZES } from "@/lib/sizes";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "App Store & Google Play screenshot sizes (2026 guide)",
  description:
    "Every screenshot size Apple App Store Connect and Google Play Console accept for iPhone, iPad, Android phones and tablets, with what is required and what is optional.",
  alternates: { canonical: "/app-store-screenshot-sizes" },
};

export default function SizesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-4xl items-center px-4 py-4">
        <Link href="/" className="font-bold">{SITE.name}</Link>
        <Link href="/app" className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Make screenshots</Link>
      </nav>
      <article className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <h1 className="text-3xl font-extrabold sm:text-4xl">App Store &amp; Google Play screenshot sizes</h1>
        <p className="mt-4 text-neutral-600">
          The portrait screenshot sizes each store accepts, what is required, and what is optional. Stores change these from time to time, so check
          Apple&apos;s and Google&apos;s official help pages before a release.
        </p>
        {(["App Store", "Google Play"] as const).map((store) => (
          <section key={store} className="mt-10">
            <h2 className="text-2xl font-bold">{store}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-neutral-300 text-neutral-500">
                  <tr>
                    <th className="py-2 pr-4">Device</th>
                    <th className="py-2 pr-4">Size (px)</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {SIZES.filter((s) => s.store === store).map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-4 font-medium">{s.label}</td>
                      <td className="py-2 pr-4 font-mono">{s.width} × {s.height}</td>
                      <td className="py-2 text-neutral-600">{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <section className="mt-10 space-y-3 text-neutral-700">
          <h2 className="text-2xl font-bold">Rules worth knowing</h2>
          <p><b>App Store:</b> up to 10 screenshots per device size and localization. PNG or JPEG, no transparency. If you provide the largest iPhone size, Apple can scale it for smaller devices.</p>
          <p><b>Google Play:</b> 2 to 8 screenshots per device type. PNG or JPEG, each side between 320 and 3,840 px, and the long side no more than twice the short side.</p>
          <p><b>Localization:</b> each language can have its own screenshots. Localized captions usually lift conversion in non-English markets.</p>
        </section>
        <div className="mt-12 rounded-2xl bg-neutral-950 p-8 text-center text-white">
          <h2 className="text-2xl font-bold">Skip the resizing</h2>
          <p className="mt-2 text-neutral-300">{SITE.name} exports every size above, in up to 40 languages, from one set of screenshots.</p>
          <Link href="/app" className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-neutral-900">Try it free</Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
