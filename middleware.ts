import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Example: Protect admin routes with basic authentication
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const basicAuth = request.headers.get("authorization")

    if (basicAuth) {
      const auth = basicAuth.split(" ")[1]
      const [user, pass] = Buffer.from(auth, "base64").toString().split(":")

      // In a real application, you would securely compare these credentials
      // For this demo, we're using simple environment variables
      if (user === process.env.BASIC_AUTH_USER && pass === process.env.BASIC_AUTH_PASS) {
        return NextResponse.next()
      }
    }

    // If authentication fails or is missing, return a 401 Unauthorized response
    return new NextResponse("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    })
  }

  // Continue to the next middleware or route if not an admin path
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"], // Apply middleware to all routes under /admin
}
