# Storeshot

App Store & Google Play screenshot generator: upload raw screenshots → AI captions → templates & device frames → every store size in up to 40 languages → one ZIP.

- **Landing page** `/` · **Editor** `/app` · **SEO size guide** `/app-store-screenshot-sizes` · `/privacy` · `/terms`
- Rendering and export happen **in the browser** (canvas + JSZip), so hosting costs stay near zero.
- Projects auto-save to the browser (IndexedDB). No accounts, no database.
- AI (captions from screenshots, translation) runs through `/api/captions` and `/api/translate` using the Anthropic API.
- Payments: any checkout link (built for **Lemon Squeezy** license keys). Pro is unlocked by pasting the license key; the server validates it with Lemon Squeezy.

## Plans (edit in `src/lib/site.ts` and `src/app/page.tsx`)

| | Free | Pro ($12/mo, $79/yr, $49 lifetime) |
|---|---|---|
| Screenshots | 3 | 10 |
| Languages | 1 | 40 + AI translation |
| AI captions | 5 runs/day per IP | fair use (300/day) |
| Watermark | yes | no |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY at least
npm run dev
```

## Deploy to Vercel (≈10 minutes)

1. Push this folder to a GitHub repo.
2. vercel.com → **Add New Project** → import the repo (framework auto-detected: Next.js).
3. Add the environment variables from `.env.example` (at minimum `ANTHROPIC_API_KEY` and `NEXT_PUBLIC_SITE_URL`).
4. Deploy. Add your custom domain under **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` and redeploy.

## Set up payments (Lemon Squeezy)

1. Create a store at lemonsqueezy.com (it is merchant of record: handles VAT/sales tax worldwide, pays out to Indian bank accounts).
2. Create one product with three variants or three products: **Pro Monthly $12** (subscription), **Pro Yearly $79** (subscription), **Lifetime $49** (single payment).
3. On each, enable **License keys** (unlimited activations, no expiry for lifetime; subscriptions disable the key automatically when cancelled).
4. Copy each product's checkout URL into `NEXT_PUBLIC_CHECKOUT_*_URL`, and your store ID into `LEMONSQUEEZY_STORE_ID`.
5. Customers receive the key by email and paste it into **Upgrade → Activate** in the editor.

For testing without buying, put a made-up key in `PRO_LICENSE_KEYS` and activate it in the editor.

## AI costs

Default model is `claude-opus-5-5` with low effort. A caption run (up to 10 screenshot thumbnails) and a 6-language translation batch are each a single request. To cut costs, set `AI_MODEL=claude-haiku-5-5`. Free-tier abuse is limited by an in-memory per-IP limit; for heavy traffic swap `rateLimit` in `src/lib/server/license.ts` for Upstash Redis.

## Known MVP limits

- The watermark and screen limits are enforced in the browser; a technical user could bypass them. AI features (the costly part) are enforced on the server.
- Projects live in one browser. Cloud sync/accounts are a v2 item.
- Store size requirements change: re-check `src/lib/sizes.ts` against Apple/Google docs periodically.

## Roadmap ideas

Direct upload to App Store Connect / Google Play, video previews, Play feature graphic (1024×500), more fonts & templates, team workspaces.
