import Link from "next/link";
import { SITE } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-8 text-sm text-neutral-500">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <Link href="/app-store-screenshot-sizes" className="hover:text-neutral-900">Screenshot size guide</Link>
        <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
        <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
        <a href={`mailto:${SITE.supportEmail}`} className="hover:text-neutral-900">Contact</a>
      </div>
    </footer>
  );
}
