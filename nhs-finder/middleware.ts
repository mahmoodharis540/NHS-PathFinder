import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const locale = request.cookies.get("locale")?.value ?? "en";
  const { pathname } = request.nextUrl;

  const isProtected =
    (pathname.startsWith("/login/admin") || pathname.startsWith("/api/admin")) &&
    pathname !== "/api/admin/login";
  if (isProtected) {
    const isLoggedIn = request.cookies.get("admin-auth")?.value === "true";
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  matcher: ["/login/admin/:path*", "/api/admin/:path*", "/((?!api|_next|.*\\..*).*)"],
};
