import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/about", "/features", "/contact", "/faq", "/privacy", "/terms"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/verify"];
const APP_ROUTES = ["/chat", "/contacts", "/groups", "/archive", "/message-requests", "/profile", "/settings", "/blocked", "/support", "/user", "/groups/join"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route =>
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(route + "/")
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
}

function isAppRoute(pathname: string): boolean {
  return pathname.startsWith("/app") || APP_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

function decodeJwt(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function sanitizeRedirect(value: string | null): string {
  if (!value) return "/chat";
  if (!value.startsWith("/")) return "/chat";
  if (value.startsWith("//")) return "/chat";
  return value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;
  const userPayload = isAuthenticated ? decodeJwt(accessToken) : null;
  const userRole = userPayload?.role || "";

  if (isPublicRoute(pathname)) {
    if (isAuthenticated) {
      const redirectUrl = new URL("/chat", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (isAuthRoute(pathname)) {
    if (pathname.startsWith("/verify")) {
      return NextResponse.next();
    }
    if (isAuthenticated) {
      const redirectUrl = new URL(
        sanitizeRedirect(request.nextUrl.searchParams.get("redirect")),
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  if (isAppRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    if (!["super_admin", "moderator", "support_staff"].includes(userRole)) {
      const redirectUrl = new URL("/chat", request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
