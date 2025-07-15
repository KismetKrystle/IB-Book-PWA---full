import { type NextRequest, NextResponse } from "next/server"
import { FinalDatabaseService } from "@/lib/final-database"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, codeId, updates } = await request.json()

    // Basic admin token validation
    const validAdminToken = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN
    if (validAdminToken && adminToken !== validAdminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else if (!validAdminToken && (!adminToken || adminToken.trim() === "")) {
      // Demo mode fallback if ADMIN_TOKEN is not set
      return NextResponse.json({ error: "Unauthorized - No token provided (demo mode)" }, { status: 401 })
    }

    const { data: updatedAccessCode, error } = await FinalDatabaseService.updateAccessCode(codeId, updates)

    if (error) {
      console.error("Error updating access code:", error)
      return NextResponse.json({ success: false, error: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, accessCode: updatedAccessCode })
  } catch (error) {
    console.error("API error updating access code:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
