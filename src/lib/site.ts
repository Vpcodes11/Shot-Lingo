// Central product config. Rename the product here.
export const SITE = {
  name: "ShotLingo",
  tagline: "App Store & Play Store screenshots in every size and 40 languages.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
};

// Fallback link where customers manage their purchase (used when no portal URL is stored).
export const BILLING_PORTAL = process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || "https://app.lemonsqueezy.com/my-orders";

export const PLANS = {
  free: { maxScreens: 3, maxLanguages: 1 },
  pro: { maxScreens: 10, maxLanguages: 40 },
};
