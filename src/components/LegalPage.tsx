import Link from "next/link";
import SiteFooter from "./SiteFooter";
import { SITE } from "@/lib/site";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="mx-auto max-w-3xl px-4 py-4">
        <Link href="/" className="font-bold">{SITE.name}</Link>
      </nav>
      <article className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-6 text-neutral-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-neutral-900">
        <h1 className="text-3xl font-extrabold text-neutral-900">{title}</h1>
        {children}
      </article>
      <SiteFooter />
    </div>
  );
}
