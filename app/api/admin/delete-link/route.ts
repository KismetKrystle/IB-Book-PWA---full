import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json({ error: "Purchase link ID is required" }, { status: 400 })
  }

  const supabase = createClient()

  try {
    // First, delete associated access codes
    const { error: deleteCodesError } = await supabase.from("access_codes").delete().eq("purchase_link_id", id)

    if (deleteCodesError) {
      console.error("Error deleting associated access codes:", deleteCodesError)
      return NextResponse.json({ error: deleteCodesError.message }, { status: 500 })
    }

    // Then, delete the purchase link
    const { error: deleteLinkError } = await supabase.from("purchase_links").delete().eq("id", id)

    if (deleteLinkError) {
      console.error("Error deleting purchase link:", deleteLinkError)
      return NextResponse.json({ error: deleteLinkError.message }, { status: 500 })
    }

    return NextResponse.json(
      { message: "Purchase link and associated access codes deleted successfully" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Unexpected error deleting purchase link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
