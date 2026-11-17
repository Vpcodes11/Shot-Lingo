// Central product config. Rename the product here.
export const SITE = {
  name: "ShotLingo",
  tagline: "App Store & Play Store screenshots in every size and 40 languages.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
};

// Checkout links (Lemon Squeezy, Stripe Payment Links, Gumroad... any URL works).
// Leave empty while testing: buttons fall back to the editor.
export const CHECKOUT = {
  monthly: process.env.NEXT_PUBLIC_CHECKOUT_MONTHLY_URL || "",
  yearly: process.env.NEXT_PUBLIC_CHECKOUT_YEARLY_URL || "",
  lifetime: process.env.NEXT_PUBLIC_CHECKOUT_LIFETIME_URL || "",
};

export const PLANS = {
  free: { maxScreens: 3, maxLanguages: 1 },
  pro: { maxScreens: 10, maxLanguages: 40 },
};
