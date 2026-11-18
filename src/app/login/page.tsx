import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getViewer } from "@/lib/server/billing";
import { safeNext } from "@/lib/safe-next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const viewer = await getViewer();
  if (viewer.user) redirect(next);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-lg font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-sm text-white">S</span>
        {SITE.name}
      </Link>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h1 className="text-xl font-bold">{sp.reason === "upgrade" ? "Sign in to upgrade" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {sp.reason === "upgrade" ? "Your Pro plan is linked to your account, so it works on any device." : "Pick up where you left off."}
        </p>
        {sp.error === "link" && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">That sign-in link expired or was already used. Request a new one.</p>
        )}
        {sp.error === "oauth" && (
          <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">Google sign-in was cancelled or failed. Try again, or use your email.</p>
        )}
        <div className="mt-5">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
