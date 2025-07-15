import { type NextRequest, NextResponse } from "next/server"
import { FinalDatabaseService } from "@/lib/final-database"

export async function POST(request: NextRequest) {
  try {
    const {
      adminToken,
      name,
      price,
      description,
      stripeEnabled,
      paypalEnabled,
      wiseEnabled,
      hasExpiration,
      expirationDate,
      previewEnabled,
      previewPages,
    } = await request.json()

    const serverAdminToken = process.env.ADMIN_TOKEN

    if (!serverAdminToken) {
      console.error("ADMIN_TOKEN environment variable is not set on the server.")
      return NextResponse.json({ error: "Server configuration error: ADMIN_TOKEN is not set." }, { status: 500 })
    }

    if (adminToken !== serverAdminToken) {
      console.error("Unauthorized: Invalid admin token provided by client.")
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    let expiresAt: string | undefined
    if (hasExpiration && expirationDate) {
      expiresAt = new Date(expirationDate).toISOString()
    }

    const { data: link, error } = await FinalDatabaseService.createPurchaseLink({
      name,
      price,
      description,
      stripe_enabled: stripeEnabled,
      paypal_enabled: paypalEnabled,
      wise_enabled: wiseEnabled,
      has_expiration: hasExpiration,
      expires_at: expiresAt,
      preview_enabled: previewEnabled,
      preview_pages: previewPages,
    })

    if (error) {
      console.error("Error creating purchase link:", error)
      return NextResponse.json({ success: false, error: error }, { status: 500 })
    }

    const shareUrl = `${request.nextUrl.origin}/pwa/buy/${link?.slug}`

    return NextResponse.json({ success: true, link, shareUrl })
  } catch (error) {
    console.error("API error creating purchase link:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
