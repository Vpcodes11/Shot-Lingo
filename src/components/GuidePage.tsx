import Link from "next/link";
import SiteFooter from "./SiteFooter";
import { SITE } from "@/lib/site";

export default function GuidePage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-3xl items-center px-4 py-4">
        <Link href="/" className="font-bold">{SITE.name}</Link>
        <Link href="/app" className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Try it free</Link>
      </nav>
      <article className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-6 text-neutral-700 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-neutral-900 [&_li]:ml-5 [&_li]:list-disc">
        <h1 className="text-3xl font-extrabold text-neutral-900 sm:text-4xl">{title}</h1>
        <p className="text-lg text-neutral-600">{intro}</p>
        {children}
        <div className="!mt-12 rounded-2xl bg-neutral-950 p-8 text-center text-white">
          <h2 className="!mt-0 text-2xl font-bold !text-white">Do it in minutes with {SITE.name}</h2>
          <p className="mt-2 text-neutral-300">Upload screenshots, let AI write and translate captions, export every size. Free to start.</p>
          <Link href="/app" className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-neutral-900">Open the editor</Link>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
