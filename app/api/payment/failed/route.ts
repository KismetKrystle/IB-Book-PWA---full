import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")
  const purchaseLinkId = searchParams.get("purchase_link_id")
  const customerEmail = searchParams.get("customer_email")

  // In a real application, you would log this failure,
  // potentially notify the customer, or trigger a retry mechanism.
  console.error(`Payment failed for session: ${sessionId}, link: ${purchaseLinkId}, email: ${customerEmail}`)

  // Optionally track the failure in your analytics
  if (purchaseLinkId) {
    await DatabaseService.trackEvent("payment_failed", {
      purchaseLinkId,
      userEmail: customerEmail || "unknown",
      metadata: { sessionId },
    })
  }

  return NextResponse.json({ message: "Payment failed. Please try again." }, { status: 200 })
}
