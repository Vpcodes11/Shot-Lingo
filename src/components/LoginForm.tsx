"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// Asks Supabase whether the Google provider is switched on, so a missing setup shows a clear message.
async function googleIsEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_ANON_KEY } });
    const data = (await res.json()) as { external?: { google?: boolean } };
    return !!data.external?.google;
  } catch {
    return true; // Let Supabase decide if the check itself fails.
  }
}

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "redirecting">("idle");
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
      setState("idle");
    } else setState("sent");
  }

  async function google() {
    setError("");
    setState("redirecting");
    if (!(await googleIsEnabled())) {
      setError("Google sign-in isn't available right now. Please use your email instead.");
      setState("idle");
      return;
    }
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo(), queryParams: { prompt: "select_account" } },
    });
    if (error) {
      setError(error.message);
      setState("idle");
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
      <button
        onClick={google}
        disabled={state !== "idle"}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 font-semibold hover:bg-neutral-50 disabled:opacity-60"
      >
        <GoogleLogo />
        {state === "redirecting" ? "Opening Google…" : "Continue with Google"}
      </button>
      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" /> or use email <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <form onSubmit={sendLink} className="space-y-3">
        <label className="sr-only" htmlFor="email">Email</label>
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
        <button disabled={state !== "idle"} className="w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white hover:bg-neutral-700 disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <p className="text-center text-xs text-neutral-500">No password needed. New here? This creates your free account.</p>
    </div>
  );
}
