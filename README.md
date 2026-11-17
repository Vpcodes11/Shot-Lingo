# ShotLingo

App Store & Google Play screenshots **and listing text** in every size and up to 40 languages.

Upload raw screenshots → AI writes captions → pick a template → AI translates → AI writes the store listing (subtitle, keywords, promo text, descriptions) → export one ZIP, either simple folders or **fastlane-ready**.

## What's inside

| Page | Purpose |
|---|---|
| `/` | Landing page with live renderer examples, features, pricing, FAQ |
| `/app` | The editor (no signup; projects auto-save in the browser) |
| `/app-store-screenshot-sizes` | SEO guide that brings in search traffic |
| `/thanks` | Post-purchase page (set as the Lemon Squeezy redirect) |
| `/privacy`, `/terms` | Legal pages (have them reviewed before launch) |
| `/api/captions`, `/api/translate`, `/api/listing`, `/api/license` | Server routes for AI + license checks |

Editor features:
- Drag-and-drop screenshots, or **"Try an example app"** for instant results
- 8 templates, 4 layouts (top / bottom / bleed / tilted), device frames (iPhone, Android, iPad), colours, text size
- Text auto-fits long translations, CJK wrapping, right-to-left (Arabic, Hebrew)
- Sizes: iPhone 6.9", 6.5", 6.3", 5.5", iPad 13" & 12.9", Android phone, 7" and 10" tablets, **Google Play feature graphic 1024×500**
- AI captions from the screenshots themselves (vision), AI translation, AI store listing text with character limits enforced
- Export: simple folders (`<lang>/<size>/01.png` + `listing.txt`) or fastlane layout (`fastlane/screenshots/<locale>/…`, `fastlane/metadata/<locale>/*.txt`, `fastlane/metadata/android/<locale>/images/phoneScreenshots/…`, `featureGraphic.png`)

Rendering happens in the browser (canvas + JSZip), so hosting costs stay near zero. The only paid infrastructure is the AI calls.

## Plans

| | Free | Pro ($12/mo · $79/yr · $49 lifetime) |
|---|---|---|
| Screenshots per project | 3 | 10 |
| Languages | 1 | 40 + AI translation |
| AI store listing text | no | yes |
| AI captions | 5 runs/day per IP | fair use (300/day) |
| Watermark | yes | no |

Change prices in `src/app/page.tsx` + `src/components/Editor.tsx`, limits in `src/lib/site.ts`.

## Deploy to Vercel

1. vercel.com → **Add New → Project** → import this repo (Next.js is detected automatically).
2. Add environment variables (see `.env.example`):
   - `ANTHROPIC_API_KEY` (required for AI), from console.anthropic.com
   - `AI_MODEL`: optional. Default `claude-opus-5-5`; `claude-haiku-5-5` is far cheaper
   - `NEXT_PUBLIC_SITE_URL`: your public URL, e.g. `https://shotlingo.app`
   - `NEXT_PUBLIC_SUPPORT_EMAIL`
   - `PRO_LICENSE_KEYS`: optional comma-separated keys that unlock Pro (testing, giveaways)
3. Deploy. Every push to `main` redeploys automatically.
4. Optional: turn on **Analytics** in the Vercel project (already wired in the code).

## Set up payments (Lemon Squeezy)

Lemon Squeezy is merchant of record: it handles VAT/sales tax worldwide and pays out to Indian bank accounts.

1. Create a store, then three products: **Pro Monthly $12** (subscription), **Pro Yearly $79** (subscription), **Lifetime $49** (single payment).
2. On each product: enable **License keys** (activation limit unlimited; lifetime keys never expire; subscription keys stop working when the subscription ends).
3. On each product: set **Confirmation → Redirect URL** to `https://YOUR-DOMAIN/thanks`.
4. Copy each checkout link into `NEXT_PUBLIC_CHECKOUT_MONTHLY_URL`, `NEXT_PUBLIC_CHECKOUT_YEARLY_URL`, `NEXT_PUBLIC_CHECKOUT_LIFETIME_URL`, and your numeric store ID into `LEMONSQUEEZY_STORE_ID`. Redeploy.
5. Do a test purchase in Lemon Squeezy test mode and activate the key in the editor.

## Using a fastlane export

```bash
unzip myapp-fastlane.zip -d /path/to/your/app
cd /path/to/your/app
fastlane deliver --skip_binary_upload   # iOS screenshots + metadata
fastlane supply --skip_upload_apk --skip_upload_aab   # Android screenshots + metadata
```

Languages without a store locale (e.g. Bengali on the App Store) are skipped for that store.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Known limits (MVP)

- Watermark and screen limits are enforced in the browser; AI features (the paid part) are enforced on the server.
- The free-tier AI rate limit is in-memory per server instance. Swap `rateLimit` in `src/lib/server/license.ts` for Upstash Redis when traffic grows.
- Projects live in one browser (no accounts or cloud sync yet).
- Store size requirements change: re-check `src/lib/sizes.ts` against Apple/Google docs before big launches.

## Roadmap ideas

Direct upload to App Store Connect / Play via API keys, App Preview videos, more fonts and templates, team workspaces, per-screen background overrides.
