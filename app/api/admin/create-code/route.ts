import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  const { code, expiration_date, usage_limit, is_active, price_id, purchase_link_id } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("access_codes")
      .insert([
        {
          code: code || nanoid(10),
          expiration_date,
          usage_limit,
          is_active,
          price_id,
          purchase_link_id,
        },
      ])
      .select()

    if (error) {
      console.error("Error creating access code:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("Unexpected error creating access code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
