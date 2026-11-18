"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Waits for the payment webhook to mark the account as Pro.
export default function ThanksStatus() {
  const [state, setState] = useState<"waiting" | "pro" | "slow" | "signedout">("waiting");

  useEffect(() => {
    let tries = 0;
    let stop = false;
    const tick = async () => {
      tries++;
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        const data = (await res.json()) as { user: unknown; pro: boolean };
        if (!data.user) return setState("signedout");
        if (data.pro) return setState("pro");
      } catch {}
      if (tries >= 20) return setState("slow");
      if (!stop) window.setTimeout(tick, 2000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, []);

  if (state === "pro") {
    return (
      <div className="mt-8">
        <p className="font-semibold text-emerald-700">✓ Pro is active on your account.</p>
        <Link href="/app" className="mt-4 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">
          Open the editor
        </Link>
      </div>
    );
  }
  if (state === "signedout") {
    return (
      <div className="mt-8">
        <p className="text-neutral-600">Sign in with the email you used at checkout to use Pro.</p>
        <Link href="/login?next=/app" className="mt-4 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white">Sign in</Link>
      </div>
    );
  }
  if (state === "slow") {
    return (
      <div className="mt-8 text-neutral-600">
        <p>Payment received. Activation is taking longer than usual. Refresh in a minute, or contact support if Pro doesn&apos;t appear.</p>
        <Link href="/account" className="mt-4 inline-block underline">Go to my account</Link>
      </div>
    );
  }
  return <p className="mt-8 animate-pulse text-neutral-600">Activating Pro on your account…</p>;
}
