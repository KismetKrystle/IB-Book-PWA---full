import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function PUT(request: Request) {
  const { id, usage_limit, expiration_date, is_active } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json({ error: "Access code ID is required" }, { status: 400 })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("access_codes")
      .update({
        usage_limit,
        expiration_date,
        is_active,
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating access code:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Access code not found" }, { status: 404 })
    }

    return NextResponse.json(data[0], { status: 200 })
  } catch (error) {
    console.error("Unexpected error updating access code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
