import Link from "next/link";
import HeroShowcase from "@/components/HeroShowcase";
import SiteFooter from "@/components/SiteFooter";
import { inter } from "@/lib/fonts";
import { CHECKOUT, SITE } from "@/lib/site";

const steps = [
  { n: "1", title: "Drop your raw screenshots", body: "Straight from the simulator or your phone. Up to 10 per app." },
  { n: "2", title: "AI writes the captions", body: "It looks at each screen and writes short, benefit-led headlines. Edit anything." },
  { n: "3", title: "Pick a style, export everything", body: "Every required App Store and Google Play size, in up to 40 languages, as one ZIP." },
];

const features = [
  { title: "Every required size", body: 'iPhone 6.9", 6.5", 6.3", 5.5", iPad 13", Android phone and tablets — rendered at the exact pixel sizes the stores accept.' },
  { title: "40 languages in one click", body: "Localized listings convert better. AI translates your captions like a native copywriter, not a dictionary." },
  { title: "Text that always fits", body: "Long German headline? Japanese with no spaces? Arabic right-to-left? The layout adapts automatically." },
  { title: "Device frames & templates", body: "Clean device frames, gradients, bleed and tilted layouts. Change the look once, every screenshot updates." },
  { title: "Update in seconds", body: "Shipped a new UI? Swap the screenshot and re-export. Captions, styles and translations stay put." },
  { title: "Private by design", body: "Screenshots stay in your browser and are rendered on your device. Only small previews go to the AI when you ask." },
];

const faqs = [
  { q: "Do I need design skills?", a: "No. Pick a template, and the layout, sizes and text fitting are handled for you." },
  { q: "Which sizes do you export?", a: "All portrait sizes App Store Connect and Google Play Console accept for phones and tablets. See the full list on our screenshot sizes guide." },
  { q: "How good are the translations?", a: "They are written as marketing copy for each language and kept short enough to fit. You can edit every line before exporting." },
  { q: "What does the free plan include?", a: "3 screenshots, 1 language, all sizes, 5 AI caption runs a day, and a small watermark." },
  { q: "Can I cancel anytime?", a: "Yes. Monthly and yearly plans can be cancelled from the receipt email in one click." },
];

export default function Home() {
  const buy = (url: string) => url || "/app";
  return (
    <div className="min-h-screen bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-fuchsia-500 text-xs text-white">S</span>
          {SITE.name}
        </Link>
        <div className="hidden gap-5 text-sm text-neutral-600 sm:flex">
          <a href="#how" className="hover:text-neutral-900">How it works</a>
          <a href="#pricing" className="hover:text-neutral-900">Pricing</a>
          <Link href="/app-store-screenshot-sizes" className="hover:text-neutral-900">Size guide</Link>
        </div>
        <Link href="/app" className="ml-auto rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">
          Open editor
        </Link>
      </nav>

      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:pt-16">
          <p className="mx-auto mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            For indie developers, app studios and agencies
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
            App Store screenshots in every size and 40 languages.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
            Drop in raw screenshots. AI writes the captions, {SITE.name} adds device frames, and you download every size the App Store and Google Play need. It takes about 10 minutes, not a weekend.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/app" className="rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">
              Start free — no signup
            </Link>
            <a href="#pricing" className="rounded-xl border border-neutral-300 px-6 py-3 font-semibold hover:bg-neutral-50">
              See pricing
            </a>
          </div>
          <div className="mt-14">
            <HeroShowcase fontFamily={inter.style.fontFamily} />
          </div>
        </div>
      </header>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Screenshots sell your app. Making them is a chore.</h2>
          </div>
          <ul className="space-y-3 text-neutral-700">
            <li>• Apple and Google want different sizes for phones and tablets.</li>
            <li>• Every screen needs a caption that sells, not describes.</li>
            <li>• Localizing into 10+ languages means hundreds of images.</li>
            <li>• Every UI update means doing it all again in Figma or Photoshop.</li>
          </ul>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-neutral-200 p-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 font-bold text-white">{s.n}</div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-neutral-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">Everything you need for store-ready screenshots</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-neutral-300">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
        <p className="mt-2 text-center text-neutral-600">Start free. Upgrade when you are ready to ship.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Plan
            name="Free"
            price="$0"
            period=""
            features={["3 screenshots", "All store sizes", "1 language", "5 AI caption runs / day", "Small watermark"]}
            cta="Start free"
            href="/app"
          />
          <Plan
            name="Pro"
            price="$12"
            period="/month"
            highlight
            note="or $79/year — save 45%"
            features={["10 screenshots per project", "All store sizes", "40 languages with AI translation", "Unlimited AI captions (fair use)", "No watermark"]}
            cta="Get Pro"
            href={buy(CHECKOUT.monthly)}
            secondary={{ label: "Get yearly — $79", href: buy(CHECKOUT.yearly) }}
          />
          <Plan
            name="Lifetime"
            price="$49"
            period=" once"
            note="Launch deal for early users"
            features={["Everything in Pro", "Pay once, use forever", "All future templates"]}
            cta="Get lifetime"
            href={buy(CHECKOUT.lifetime)}
          />
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold">FAQ</h2>
          <div className="mt-8 divide-y divide-neutral-200">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold">
                  {f.q}
                  <span className="float-right text-neutral-400 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-neutral-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="text-3xl font-bold">Ship better screenshots today</h2>
        <p className="mt-2 text-neutral-600">No signup. Your first set is free.</p>
        <Link href="/app" className="mt-6 inline-block rounded-xl bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">
          Open the editor
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}

function Plan(props: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  note?: string;
  highlight?: boolean;
  secondary?: { label: string; href: string };
}) {
  const external = props.href.startsWith("http");
  return (
    <div className={`flex flex-col rounded-2xl p-6 ${props.highlight ? "border-2 border-indigo-600 shadow-lg" : "border border-neutral-200"}`}>
      <h3 className="font-semibold">{props.name}</h3>
      <div className="mt-3">
        <span className="text-4xl font-extrabold">{props.price}</span>
        <span className="text-neutral-500">{props.period}</span>
      </div>
      {props.note && <p className="mt-1 text-sm text-indigo-700">{props.note}</p>}
      <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-700">
        {props.features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <a
        href={props.href}
        {...(external ? { target: "_blank", rel: "noopener" } : {})}
        className={`mt-6 rounded-xl px-4 py-3 text-center font-semibold ${props.highlight ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-neutral-900 text-white hover:bg-neutral-700"}`}
      >
        {props.cta}
      </a>
      {props.secondary && (
        <a
          href={props.secondary.href}
          {...(props.secondary.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
          className="mt-2 rounded-xl border border-neutral-300 px-4 py-2.5 text-center text-sm font-semibold hover:bg-neutral-50"
        >
          {props.secondary.label}
        </a>
      )}
    </div>
  );
}
