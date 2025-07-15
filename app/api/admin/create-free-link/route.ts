import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  const { name, description, preview_pages } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const { data: linkData, error: linkError } = await supabase
      .from("purchase_links")
      .insert([
        {
          name,
          description,
          is_free: true,
          preview_pages,
        },
      ])
      .select()

    if (linkError) {
      console.error("Error creating free purchase link:", linkError)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    const purchaseLink = linkData[0]

    // Create a default access code for the free link
    const { data: codeData, error: codeError } = await supabase
      .from("access_codes")
      .insert([
        {
          code: nanoid(10), // Generate a unique code
          purchase_link_id: purchaseLink.id,
          is_active: true,
          usage_limit: null, // No usage limit for free codes
          expiration_date: null, // No expiration for free codes
        },
      ])
      .select()

    if (codeError) {
      console.error("Error creating access code for free link:", codeError)
      // Optionally, delete the created purchase link if code creation fails
      await supabase.from("purchase_links").delete().eq("id", purchaseLink.id)
      return NextResponse.json({ error: codeError.message }, { status: 500 })
    }

    return NextResponse.json({ purchaseLink, accessCode: codeData[0] }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error creating free purchase link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
