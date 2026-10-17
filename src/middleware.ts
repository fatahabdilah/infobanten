import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/** Lindungi /wp-admin seperti WordPress: belum login → /wp-login.php?redirect_to=... */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token && (await verifySession(token))) return NextResponse.next();
  const target = `/wp-login.php?redirect_to=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(new URL(target, req.url));
}

export const config = { matcher: ["/wp-admin", "/wp-admin/:path*"] };
