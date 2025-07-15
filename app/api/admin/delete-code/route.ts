import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const adminToken = request.headers.get("Authorization")?.split(" ")[1]

  if (process.env.ADMIN_TOKEN && adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!id) {
    return NextResponse.json({ error: "Access code ID is required" }, { status: 400 })
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.from("access_codes").delete().eq("id", id)

    if (error) {
      console.error("Error deleting access code:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Access code deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error deleting access code:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
