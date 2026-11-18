import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static files, images and the payment webhook.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|api/webhooks|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
