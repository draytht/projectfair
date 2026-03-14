import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Coming Soon lock ──────────────────────────────────────────────
// Automatically disabled in development; set to false when ready to launch
const COMING_SOON = process.env.NODE_ENV === "production";

const COMING_SOON_BYPASS = ["/coming-soon", "/_next", "/favicon", "/api"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (COMING_SOON) {
    const bypassed = COMING_SOON_BYPASS.some((p) => pathname.startsWith(p));
    if (!bypassed) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }
  // ─────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!coming-soon|_next|favicon\\.ico|.*\\..*).*)" ],
};