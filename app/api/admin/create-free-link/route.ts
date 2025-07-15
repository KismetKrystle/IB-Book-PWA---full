import { type NextRequest, NextResponse } from "next/server"
import { FinalDatabaseService } from "@/lib/final-database"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, name, description, expiresInDays, previewPages } = await request.json()

    // Basic admin token validation
    const validAdminToken = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN
    if (validAdminToken && adminToken !== validAdminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else if (!validAdminToken && (!adminToken || adminToken.trim() === "")) {
      // Demo mode fallback if ADMIN_TOKEN is not set
      return NextResponse.json({ error: "Unauthorized - No token provided (demo mode)" }, { status: 401 })
    }

    let expiresAt: string | undefined
    if (expiresInDays) {
      const date = new Date()
      date.setDate(date.getDate() + expiresInDays)
      expiresAt = date.toISOString()
    }

    const { data: link, error } = await FinalDatabaseService.createFreeAccessLink({
      name,
      description,
      has_expiration: !!expiresInDays,
      expires_at: expiresAt,
      preview_pages: previewPages,
    })

    if (error) {
      console.error("Error creating free link:", error)
      return NextResponse.json({ success: false, error: error }, { status: 500 })
    }

    const shareUrl = `${request.nextUrl.origin}/pwa/buy/${link?.slug}`

    return NextResponse.json({ success: true, link, shareUrl })
  } catch (error) {
    console.error("API error creating free link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
