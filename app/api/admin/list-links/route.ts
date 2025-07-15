import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { adminToken } = await request.json()

    const serverAdminToken = process.env.ADMIN_TOKEN

    if (!serverAdminToken) {
      console.error("ADMIN_TOKEN environment variable is not set on the server.")
      return NextResponse.json({ error: "Server configuration error: ADMIN_TOKEN is not set." }, { status: 500 })
    }

    if (adminToken !== serverAdminToken) {
      console.error("Unauthorized: Invalid admin token provided by client.")
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    try {
      const { data: links, error } = await supabaseAdmin
        .from("purchase_links")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      const transformedLinks =
        links?.map((link) => ({
          id: link.id,
          name: link.name,
          slug: link.slug,
          price: link.price,
          currency: link.currency,
          description: link.description,
          createdAt: link.created_at,
          expiresAt: link.expires_at,
          hasExpiration: link.has_expiration,
          clicks: link.clicks,
          purchases: link.purchases,
          revenue: link.revenue,
          active: link.active,
          isDefault: link.is_default,
          stripeEnabled: link.stripe_enabled,
          paypalEnabled: link.paypal_enabled,
          wiseEnabled: link.wise_enabled,
          stripePriceId: link.stripe_price_id,
          paypalLink: link.paypal_link,
          wiseLink: link.wise_link,
          previewEnabled: link.preview_enabled,
          previewPages: link.preview_pages,
        })) || []

      return NextResponse.json({ success: true, links: transformedLinks })
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        {
          success: true,
          links: [], // Return empty array or demo data if DB fails
          warning: "Using demo data - database connection failed",
        },
        { status: 200 },
      )
    }
  } catch (error) {
    console.error("List links error:", error)
    return NextResponse.json(
      {
        error: "Failed to list purchase links",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
