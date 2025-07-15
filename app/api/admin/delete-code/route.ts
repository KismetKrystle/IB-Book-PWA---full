import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, codeId } = await request.json()

    const serverAdminToken = process.env.ADMIN_TOKEN

    if (!serverAdminToken) {
      console.error("ADMIN_TOKEN environment variable is not set on the server.")
      return NextResponse.json({ error: "Server configuration error: ADMIN_TOKEN is not set." }, { status: 500 })
    }

    if (adminToken !== serverAdminToken) {
      console.error("Unauthorized: Invalid admin token provided by client.")
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
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
