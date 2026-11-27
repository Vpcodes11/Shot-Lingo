# ShotLingo

App Store & Google Play screenshots **and listing text** in every size and up to 40 languages. A complete SaaS: free tier, accounts, Pro subscriptions, webhooks, usage limits.

Upload raw screenshots → AI writes captions → pick a template → AI translates → AI writes the store listing → export one ZIP (simple folders or **fastlane-ready**).

## Architecture

| Part | Tech |
|---|---|
| App + API | Next.js 15 (App Router) on Vercel |
| Rendering & export | In the browser (canvas + JSZip): near-zero hosting cost |
| Accounts | Supabase Auth: Google sign-in + email magic link |
| Database | Supabase Postgres: `subscriptions`, `usage_counters`, `webhook_events`, with row level security |
| Payments | Lemon Squeezy (merchant of record: global tax, pays out to India), synced by signed webhooks |
| AI | Anthropic API (captions from screenshots, translation, listing text) |

How a sale works: user clicks a plan → signs in (if needed) → `/api/checkout` sends them to Lemon Squeezy with their email and user id attached → after payment Lemon Squeezy calls `/api/webhooks/lemonsqueezy` → the subscription is stored → `/thanks` detects Pro within seconds. Cancellations, renewals, failed payments, expiry and refunds all arrive through the same webhook.

## Plans

| | Free (no signup) | Pro: $12/mo · $79/yr · $49 lifetime |
|---|---|---|
| Screenshots per project | 3 | 10 |
| Languages | 1 | 40 + AI translation |
| AI store listing text | – | ✓ |
| AI captions | 5/day | fair use (300/day) |
| Watermark | yes | no |

AI limits are enforced on the server (database counters). Prices: `src/app/page.tsx`, `src/components/Editor.tsx`, `src/app/account/page.tsx`. Limits: `src/lib/site.ts` and the API routes.

---

## Go-live checklist (about 1 hour)

### 1. Supabase (accounts + database)
1. Create a project at supabase.com (free tier is fine). Pick a region near your users.
2. **SQL Editor** → paste the contents of `supabase/migrations/20261118000000_init.sql` → Run.
   (Or with the CLI: `npx supabase link --project-ref <ref>` then `npx supabase db push`.)
3. **Authentication → URL Configuration**: Site URL = `https://YOUR-DOMAIN`; add redirect URL `https://YOUR-DOMAIN/**` (and your `*.vercel.app` URL while testing).
4. **Authentication → Emails → Templates → Magic Link** and **Confirm signup**: subject `Your ShotLingo sign-in link`, body from `supabase/templates/magic_link.html`.
5. **Authentication → Emails → SMTP**: connect a sender (e.g. Resend, free tier). Supabase's built-in email is rate-limited and only for testing.
6. **Google sign-in** (shown on the login page by default; until it's set up, the button tells users to use email):
   1. Google Cloud Console → **APIs & Services → OAuth consent screen**: app name “ShotLingo”, your support email, your domain; add scopes `email`, `profile`, `openid`; then **Publish app** (otherwise only test users can sign in).
   2. **Credentials → Create credentials → OAuth client ID → Web application**.
      - Authorized JavaScript origins: `https://YOUR-DOMAIN`
      - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (shown in Supabase under Authentication → Providers → Google)
   3. Supabase → **Authentication → Providers → Google** → enable, paste the Client ID and Client secret, save.
7. **Project Settings → API**: copy the URL, anon key and service role key.

### 2. Lemon Squeezy (payments)
1. Create a store, complete identity verification, add your payout bank account.
2. Create products: **Pro Monthly $12** (subscription), **Pro Yearly $79** (subscription), **Lifetime $49** (single payment). No license keys needed.
3. On each product, set the **redirect after purchase** to `https://YOUR-DOMAIN/thanks`.
4. Copy each product's checkout (Share) link, the **store id**, and the lifetime **variant id**.
5. **Settings → Webhooks → +**: URL `https://YOUR-DOMAIN/api/webhooks/lemonsqueezy`, choose a signing secret, and tick: `order_created`, `order_refunded`, `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_paused`, `subscription_unpaused`.
6. Optional: **Settings → API** → create a key (lets “Manage billing” open a fresh portal link).

### 3. Vercel (hosting)
1. Import this GitHub repo.
2. Add every variable from `.env.example` (Supabase, Anthropic, Lemon Squeezy, site URL, support email). Set `AI_MODEL=claude-haiku-5-5` to keep AI costs low.
3. Deploy, then add your domain under **Settings → Domains** and update `NEXT_PUBLIC_SITE_URL` and the Supabase URL settings.

Then open `https://YOUR-DOMAIN/api/health?key=YOUR_HEALTH_KEY`: it lists every setting as present or missing (never the values).

### 4. Test with real money off
1. In Lemon Squeezy, switch to **Test mode** (test products and webhook). Buy with card `4242 4242 4242 4242`.
2. Check: `/thanks` says Pro is active → `/account` shows the plan → translation works → “Manage billing” opens the portal → cancel there → account shows “Pro until …”.
3. Check the Supabase table `webhook_events` if anything looks wrong; every webhook is logged there.
4. Switch Lemon Squeezy to live mode (live products, live webhook) and update the env vars.

---

## Local development

```bash
npm install
npx supabase start              # needs Docker; local Postgres, Auth and an inbox at http://127.0.0.1:54324
cp .env.example .env.local      # fill in values printed by `npx supabase status`
npm run dev
```

## Exports

- **Simple:** `<lang>/<size>/01_1320x2868.png`, `<lang>/feature-graphic_1024x500.png`, `<lang>/listing.txt`
- **fastlane:** `fastlane/screenshots/<locale>/…`, `fastlane/metadata/<locale>/*.txt`, `fastlane/metadata/android/<locale>/images/phoneScreenshots/…`, `featureGraphic.png`

```bash
fastlane deliver --skip_binary_upload
fastlane supply --skip_upload_apk --skip_upload_aab
```

## Security notes

- Subscription rows are written only by the server after verifying Lemon Squeezy's HMAC signature; users can only read their own rows (RLS).
- Duplicate webhook deliveries are ignored; older events never overwrite newer state.
- `SUPABASE_SERVICE_ROLE_KEY`, `LEMONSQUEEZY_*` and `ANTHROPIC_API_KEY` are server-only.
- The watermark and screenshot limit are applied in the browser. The paid AI features are enforced on the server.

## Roadmap ideas

Cloud sync of projects, direct upload to App Store Connect / Play, App Preview videos, team seats, more templates and fonts.

DQo39XYZQa6xXJYt
