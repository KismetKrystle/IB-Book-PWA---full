import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const linkId = searchParams.get("linkId")

  if (!linkId) {
    return NextResponse.json({ error: "Link ID is required" }, { status: 400 })
  }

  const supabase = createClient()

  try {
    const { data: purchaseLink, error } = await supabase.from("purchase_links").select("*").eq("id", linkId).single()

    if (error || !purchaseLink) {
      console.error("Error fetching purchase link:", error?.message || "Link not found")
      return NextResponse.json({ error: "Purchase link not found" }, { status: 404 })
    }

    return NextResponse.json(purchaseLink, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in payment/select:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
