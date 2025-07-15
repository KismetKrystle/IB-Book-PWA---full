import { type NextRequest, NextResponse } from "next/server"

// This would integrate with Stripe in production
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "usd" } = await request.json()

    // Demo mode - generate access code immediately
    const accessCode = Math.random().toString(36).substring(2, 15).toUpperCase()

    // In production, this would create a Stripe payment intent
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100,
    //   currency,
    //   metadata: { product: 'infinite-bloom-book' }
    // })

    return NextResponse.json({
      success: true,
      accessCode, // In demo mode
      // clientSecret: paymentIntent.client_secret // In production
    })
  } catch (error) {
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 })
  }
}
