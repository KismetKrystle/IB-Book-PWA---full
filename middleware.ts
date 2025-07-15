import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle admin routes separately from PWA
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const response = NextResponse.next()

    // Remove PWA-related headers for admin routes
    response.headers.delete("Service-Worker-Allowed")
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")

    // Add security headers for admin routes
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")

    return response
  }

  // For PWA routes, ensure proper PWA headers
  if (pathname.startsWith("/pwa") || pathname === "/") {
    const response = NextResponse.next()
    response.headers.set("Service-Worker-Allowed", "/")
    return response
  }

  // For all other routes, allow normal PWA behavior
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match admin routes
    "/admin/:path*",
    "/api/admin/:path*",
    // Exclude static files and API routes that should remain cached
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|service-worker.js).*)",
  ],
}
