import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: Request) {
  const { name, description, price_id, preview_pages } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("purchase_links")
      .insert([
        {
          name,
          description,
          price_id,
          is_free: false,
          preview_pages,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating purchase link:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Unexpected error creating purchase link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
