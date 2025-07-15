import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, linkId } = await request.json()

    const serverAdminToken = process.env.ADMIN_TOKEN

    if (!serverAdminToken) {
      console.error("ADMIN_TOKEN environment variable is not set on the server.")
      return NextResponse.json({ error: "Server configuration error: ADMIN_TOKEN is not set." }, { status: 500 })
    }

    if (adminToken !== serverAdminToken) {
      console.error("Unauthorized: Invalid admin token provided by client.")
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
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
