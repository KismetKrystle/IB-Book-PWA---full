import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("access_codes")
      .select(`
      *,
      purchase_links (
        name,
        description,
        price_id,
        is_free
      )
    `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error listing access codes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Unexpected error listing access codes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
