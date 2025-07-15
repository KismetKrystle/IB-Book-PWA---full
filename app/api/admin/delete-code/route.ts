import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, codeId } = await request.json()

    // Basic admin token validation
    const validAdminToken = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN
    if (validAdminToken && adminToken !== validAdminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else if (!validAdminToken && (!adminToken || adminToken.trim() === "")) {
      // Demo mode fallback if ADMIN_TOKEN is not set
      return NextResponse.json({ error: "Unauthorized - No token provided (demo mode)" }, { status: 401 })
    }

    const { error } = await supabaseAdmin.from("access_codes").delete().eq("id", codeId)

    if (error) {
      console.error("Error deleting access code:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error deleting access code:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
