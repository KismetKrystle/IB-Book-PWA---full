import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, linkId } = await request.json()

    // Basic admin token validation
    const validAdminToken = process.env.ADMIN_TOKEN || process.env.NEXT_PUBLIC_ADMIN_TOKEN
    if (validAdminToken && adminToken !== validAdminToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    } else if (!validAdminToken && (!adminToken || adminToken.trim() === "")) {
      // Demo mode fallback if ADMIN_TOKEN is not set
      return NextResponse.json({ error: "Unauthorized - No token provided (demo mode)" }, { status: 401 })
    }

    // Check if it's the default link
    const { data: link, error: fetchError } = await supabaseAdmin
      .from("purchase_links")
      .select("is_default")
      .eq("id", linkId)
      .single()

    if (fetchError) {
      console.error("Error fetching link for deletion:", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 })
    }

    if (link?.is_default) {
      return NextResponse.json({ success: false, error: "Cannot delete default purchase link." }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("purchase_links").delete().eq("id", linkId)

    if (error) {
      console.error("Error deleting purchase link:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error deleting purchase link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
