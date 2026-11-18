"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  async function google() {
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) {
      setError(error.message);
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-900">Check your email</p>
        <p className="mt-2 text-sm text-emerald-800">
          We sent a sign-in link to <b>{email}</b>. Open it on this device. Nothing there? Check spam, or{" "}
          <button className="underline" onClick={() => setState("idle")}>try again</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <button onClick={google} className="w-full rounded-xl border border-neutral-300 px-4 py-3 font-semibold hover:bg-neutral-50">
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" /> or <span className="h-px flex-1 bg-neutral-200" />
          </div>
        </>
      )}
      <form onSubmit={sendLink} className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-neutral-300 px-4 py-3"
        />
        <button disabled={state === "sending"} className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white hover:bg-neutral-700 disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-center text-xs text-neutral-500">No password needed. New here? This creates your free account.</p>
    </div>
  );
}
