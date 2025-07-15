import { type NextRequest, NextResponse } from "next/server"
import { FinalDatabaseService } from "@/lib/final-database"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, type, maxUses, expiresInDays, notes, customerName, customerEmail } = await request.json()

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

    const { data: accessCode, error } = await FinalDatabaseService.createAccessCode({
      type,
      max_uses: maxUses,
      expires_at: expiresAt,
      notes,
      customer_name: customerName,
      customer_email: customerEmail,
      created_by: "admin_dashboard",
    })

    if (error) {
      console.error("Error creating access code:", error)
      return NextResponse.json({ success: false, error: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, accessCode })
  } catch (error) {
    console.error("API error creating access code:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
