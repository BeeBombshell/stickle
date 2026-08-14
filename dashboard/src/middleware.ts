import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that are only accessible when NOT authenticated
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

// Routes that require authentication (everything under the app shell)
const APP_ROUTES = ["/notes", "/timeline", "/settings", "/upgrade", "/onboarding"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://hipwwiftfdthbdwtmvky.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "sb_publishable_5YLqOjJTKY_KYHojfZ1A2A_rWULmcjg";

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Layer 1 — Refresh the session cookie on every request.
  // We use getUser() (not getSession()) because getUser() round-trips to Supabase Auth
  // to verify the JWT server-side. getSession() only reads the cookie, which can be
  // spoofed if the cookie value is tampered with.
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isAppRoute = APP_ROUTES.some((r) => pathname.startsWith(r));

  // Unauthenticated user hitting an app route → redirect to /login
  // Preserve the intended destination so we can redirect back after sign-in.
  if (!user && isAppRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting an auth route → redirect to /notes
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|icon\\.svg|og-image\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp)$).*)",
  ],
};
