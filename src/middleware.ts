import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// In-memory rate limiter — works for single-instance (Vercel hobby/pro).
// Upgrade to Upstash Redis for multi-region deployments.
const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const pathname = request.nextUrl.pathname;

  // Rate limit auth endpoints: 10 req / min per IP
  if (pathname.startsWith("/api/auth/")) {
    if (!rateLimit(ip, 10, 60_000)) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }
  // Rate limit all other API routes: 120 req / min per IP
  else if (pathname.startsWith("/api/")) {
    if (!rateLimit(ip, 120, 60_000)) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  // Non-dashboard routes don't need a Supabase round-trip —
  // saves 80-150ms on every public page / API call.
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  if (!isDashboard && !isAuthPage) {
    return NextResponse.next();
  }

  // Supabase auth check (only for dashboard + auth pages)
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Dashboard + auth pages → need Supabase check
    "/dashboard/:path*",
    "/login",
    "/signup",
    // All API routes → need rate limiting
    "/api/:path*",
  ],
};
