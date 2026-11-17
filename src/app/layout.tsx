import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { SITE } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — App Store screenshots in every size and 40 languages`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Turn raw screenshots into polished App Store and Google Play screenshots. AI captions, every required size, 40 languages, one ZIP. Free to start.",
  openGraph: {
    title: `${SITE.name} — App Store screenshots in minutes`,
    description: "AI captions, every required size, 40 languages. One click.",
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
