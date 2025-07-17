import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { DatabaseService } from "@/lib/database"
import { createClient } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
})

export async function POST(req: NextRequest) {
  const buf = await req.text()
  const sig = req.headers.get("stripe-signature")

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const supabaseAdmin = createClient(true) // Use admin client for server-side operations

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session

      const customerEmail = session.customer_details?.email
      const purchaseLinkId = session.metadata?.purchase_link_id
      const amountTotal = session.amount_total
      const currency = session.currency

      if (session.payment_status === "paid" && customerEmail && purchaseLinkId && amountTotal !== null && currency) {
        try {
          // 1. Create an access code for the customer
          const { data: accessCode, error: accessCodeError } = await supabaseAdmin
            .from("access_codes")
            .insert({
              code: Math.random().toString(36).substring(2, 10).toUpperCase(), // Generate a random code
              usage_limit: 1, // Typically 1 use for a purchased code
              is_active: true,
              purchase_link_id: purchaseLinkId,
              customer_email: customerEmail,
              transaction_id: session.id,
              amount_paid: amountTotal / 100, // Convert cents to dollars
              currency: currency.toUpperCase(),
              payment_processor: "stripe",
              purchase_date: new Date().toISOString(),
            })
            .select()
            .single()

          if (accessCodeError) {
            console.error("Error creating access code:", accessCodeError)
            // Log this as a system failure to be reviewed manually
            await DatabaseService.trackEvent("system_failure", {
              eventType: "access_code_creation_failed",
              metadata: {
                stripeSessionId: session.id,
                customerEmail,
                purchaseLinkId,
                errorMessage: accessCodeError.message,
              },
            })
            return NextResponse.json({ message: "Access code creation failed" }, { status: 500 })
          }

          // 2. Increment purchase count and revenue for the purchase link
          const { error: rpcError } = await supabaseAdmin.rpc("increment_link_purchases_and_revenue", {
            link_id: purchaseLinkId,
            amount: amountTotal / 100,
          })

          if (rpcError) {
            console.error("Error incrementing link purchases/revenue:", rpcError)
            await DatabaseService.trackEvent("system_failure", {
              eventType: "link_stats_update_failed",
              metadata: {
                stripeSessionId: session.id,
                purchaseLinkId,
                errorMessage: rpcError.message,
              },
            })
          }

          // 3. Track the purchase event
          await DatabaseService.trackEvent("purchase_completed", {
            purchaseLinkId,
            accessCodeId: accessCode?.id,
            userEmail: customerEmail,
            metadata: {
              amount: amountTotal / 100,
              currency: currency.toUpperCase(),
              transactionId: session.id,
              paymentProcessor: "stripe",
            },
          })

          console.log(`Stripe payment succeeded for ${customerEmail}. Access code: ${accessCode?.code}`)
        } catch (error) {
          console.error("Error handling checkout.session.completed:", error)
          return NextResponse.json({ message: "Internal server error" }, { status: 500 })
        }
      }
      break
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(`PaymentIntent ${paymentIntent.id} was successful!`)
      // Handle payment intent success (e.g., update order status)
      break
    case "payment_method.attached":
      const paymentMethod = event.data.object as Stripe.PaymentMethod
      console.log(`PaymentMethod ${paymentMethod.id} was attached to a Customer!`)
      // Handle payment method attachment
      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
