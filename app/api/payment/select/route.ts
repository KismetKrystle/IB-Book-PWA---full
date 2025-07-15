import { type NextRequest, NextResponse } from "next/server"
import { EnhancedDatabaseService } from "@/lib/enhanced-database"

export async function POST(request: NextRequest) {
  try {
    const { purchaseLinkSlug, processor } = await request.json()

    if (!purchaseLinkSlug || !processor) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get purchase link details
    const { data: purchaseLink, error } = await EnhancedDatabaseService.getPurchaseLinkBySlug(purchaseLinkSlug)

    if (error || !purchaseLink) {
      return NextResponse.json({ error: "Purchase link not found" }, { status: 404 })
    }

    // Check if processor is enabled for this link
    const processorEnabled = {
      stripe: purchaseLink.stripe_enabled,
      paypal: purchaseLink.paypal_enabled,
      wise: purchaseLink.wise_enabled,
    }

    if (!processorEnabled[processor as keyof typeof processorEnabled]) {
      return NextResponse.json({ error: "Payment processor not available for this offer" }, { status: 400 })
    }

    // Track the click
    await EnhancedDatabaseService.trackLinkClick(purchaseLinkSlug, {
      country: request.headers.get("cf-ipcountry") || undefined,
      device_type: request.headers.get("user-agent")?.includes("Mobile") ? "mobile" : "desktop",
    })

    // Generate payment session based on processor
    let paymentUrl = ""
    let sessionData = {}

    switch (processor) {
      case "stripe":
        // In production, create Stripe checkout session
        paymentUrl = `/api/payment/stripe/checkout?link=${purchaseLinkSlug}`
        sessionData = {
          processor: "stripe",
          amount: purchaseLink.price,
          currency: purchaseLink.currency,
        }
        break

      case "paypal":
        // In production, create PayPal order
        paymentUrl = `/api/payment/paypal/checkout?link=${purchaseLinkSlug}`
        sessionData = {
          processor: "paypal",
          amount: purchaseLink.price,
          currency: purchaseLink.currency,
        }
        break

      case "wise":
        // In production, create Wise payment
        paymentUrl = `/api/payment/wise/checkout?link=${purchaseLinkSlug}`
        sessionData = {
          processor: "wise",
          amount: purchaseLink.price,
          currency: purchaseLink.currency,
        }
        break

      default:
        return NextResponse.json({ error: "Invalid payment processor" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      paymentUrl,
      sessionData,
      purchaseLink: {
        name: purchaseLink.name,
        price: purchaseLink.price,
        currency: purchaseLink.currency,
        description: purchaseLink.description,
      },
    })
  } catch (error) {
    console.error("Payment selection error:", error)
    return NextResponse.json({ error: "Payment selection failed" }, { status: 500 })
  }
}
