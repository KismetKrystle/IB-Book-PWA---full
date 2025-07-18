import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { FinalDatabaseService } from "@/lib/final-database" // Using FinalDatabaseService
import { createClient } from "@/lib/supabase"
import { Resend } from "resend"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

const resend = new Resend(process.env.RESEND_API_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const supabase = createClient() // Client for logging, admin for operations
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No Stripe signature header" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session
      console.log(`Checkout session completed for session ID: ${session.id}`)

      // Retrieve customer details from the session
      const customerEmail = session.customer_details?.email
      const customerName = session.customer_details?.name
      const amountTotal = session.amount_total
      const currency = session.currency
      const paymentIntentId = session.payment_intent as string // Assuming payment_intent is always a string here

      if (!customerEmail || amountTotal === null || currency === null || !paymentIntentId) {
        console.error("Missing essential data in checkout.session.completed event.")
        return NextResponse.json({ error: "Missing essential data" }, { status: 400 })
      }

      // Find the purchase link associated with the price ID
      const priceId = session.line_items?.data[0]?.price?.id // Assuming single line item
      if (!priceId) {
        console.error("No price ID found in checkout session line items.")
        return NextResponse.json({ error: "No price ID found" }, { status: 400 })
      }

      // Fetch the purchase link from your database using the stripe_price_id
      const { data: purchaseLink, error: linkError } = await supabase
        .from("purchase_links")
        .select("id")
        .eq("stripe_price_id", priceId)
        .single()

      if (linkError || !purchaseLink) {
        console.error("Error finding purchase link for price ID:", linkError?.message || "Link not found")
        return NextResponse.json({ error: "Purchase link not found for price ID" }, { status: 404 })
      }

      // Create a new access code for the customer using FinalDatabaseService
      const { data: newAccessCode, error: accessCodeError } = await FinalDatabaseService.createAccessCode({
        type: "purchase",
        customer_name: customerName || undefined,
        customer_email: customerEmail,
        payment_processor: "stripe",
        transaction_id: paymentIntentId,
        amount_paid: amountTotal / 100, // Convert cents to dollars
        currency: currency.toUpperCase(),
        purchase_link_id: purchaseLink.id,
      })

      if (accessCodeError || !newAccessCode) {
        console.error("Error creating access code:", accessCodeError || "Failed to create access code")
        return NextResponse.json({ error: "Failed to create access code" }, { status: 500 })
      }

      console.log("Access code created:", newAccessCode)

      // Send email with access code
      try {
        const emailResult = await resend.emails.send({
          from: "The Infinite Bloom <noreply@yourdomain.com>", // Update with your domain
          to: customerEmail,
          subject: "Your Access Code for The Infinite Bloom",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Access Code - The Infinite Bloom</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header with Logo -->
                  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%); padding: 40px 20px; text-align: center;">
                    <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 24px; font-weight: bold; color: #8b5cf6;">∞</span>
                      </div>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">The Infinite Bloom</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Evolving by Perspective</p>
                  </div>

                  <!-- Content -->
                  <div style="padding: 40px 20px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Thank you for your purchase!</h2>
                    
                    <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                      Hi ${customerName || "there"},
                    </p>
                    
                    <p style="color: #4b5563; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                      Your payment has been processed successfully! Here's your unique access code to start reading The Infinite Bloom:
                    </p>

                    <!-- Access Code Box -->
                    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #8b5cf6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Access Code</p>
                      <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #8b5cf6; letter-spacing: 4px; margin: 10px 0;">${newAccessCode.code}</div>
                      <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 12px;">Save this code - you'll need it to access your book</p>
                    </div>

                    <!-- Instructions -->
                    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">How to access your book:</h3>
                      <ol style="color: #4b5563; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                        <li>Click the button below to open The Infinite Bloom app</li>
                        <li>Enter your access code when prompted</li>
                        <li>Set up your account with email and password</li>
                        <li>Start reading and enjoying your poetry collection!</li>
                      </ol>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 40px 0;">
                      <a href="${process.env.NEXT_PUBLIC_API_URL || "https://yourdomain.com"}/pwa?code=${newAccessCode.code}" 
                         style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        Open The Infinite Bloom App
                      </a>
                    </div>

                    <!-- Features -->
                    <div style="border-top: 1px solid #e5e7eb; padding-top: 30px; margin-top: 30px;">
                      <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; text-align: center;">What you get:</h3>
                      <div style="display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap;">
                        <div style="margin: 10px;">
                          <div style="color: #8b5cf6; font-size: 24px; margin-bottom: 8px;">📖</div>
                          <p style="color: #4b5563; margin: 0; font-size: 14px; font-weight: 600;">45 Poems</p>
                        </div>
                        <div style="margin: 10px;">
                          <div style="color: #8b5cf6; font-size: 24px; margin-bottom: 8px;">🎧</div>
                          <p style="color: #4b5563; margin: 0; font-size: 14px; font-weight: 600;">Audio Included</p>
                        </div>
                        <div style="margin: 10px;">
                          <div style="color: #8b5cf6; font-size: 24px; margin-bottom: 8px;">📱</div>
                          <p style="color: #4b5563; margin: 0; font-size: 14px; font-weight: 600;">Up to 3 Devices</p>
                        </div>
                        <div style="margin: 10px;">
                          <div style="color: #8b5cf6; font-size: 24px; margin-bottom: 8px;">💾</div>
                          <p style="color: #4b5563; margin: 0; font-size: 14px; font-weight: 600;">Offline Access</p>
                        </div>
                      </div>
                    </div>

                    <!-- Support -->
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                        <strong>Need help?</strong> If you have any questions or issues accessing your book, please reply to this email and we'll assist you promptly.
                      </p>
                    </div>

                    <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px; text-align: center;">
                      Thank you for choosing The Infinite Bloom. We hope you enjoy this transformative journey through poetry.
                    </p>
                  </div>

                  <!-- Footer -->
                  <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0; font-size: 12px;">
                      © 2024 The Infinite Bloom by Kismet Krystle. All rights reserved.
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        })

        // Mark email as sent
        await supabase.from("access_codes").update({ email_sent: true }).eq("id", newAccessCode.id)

        console.log("Email sent successfully:", emailResult.data?.id)
      } catch (emailError) {
        console.error("Failed to send email:", emailError)
        // Log email failure for monitoring
        await logEmailFailure(newAccessCode.id, customerEmail, (emailError as Error).message)
        // Mark email as failed but don't fail the webhook
        await supabase.from("access_codes").update({ email_sent: false }).eq("id", newAccessCode.id)
      }

      console.log(`Successfully processed payment for ${customerEmail}, access code: ${newAccessCode.code}`)
      return NextResponse.json({ received: true })
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`)
      // Then define and call a function to fulfill the customer's purchase
      break
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  // Return a 200 response to acknowledge receipt of the event
  return NextResponse.json({ received: true }, { status: 200 })
}

// Helper function to log webhook failures
async function logWebhookFailure(sessionId: string, errorMessage: string) {
  try {
    await createClient().from("webhook_failures").insert({
      event_type: "checkout.session.completed",
      stripe_session_id: sessionId,
      error_message: errorMessage,
      retry_count: 0,
      resolved: false,
    })
  } catch (error) {
    console.error("Failed to log webhook failure:", error)
  }
}

// Helper function to log email failures
async function logEmailFailure(accessCodeId: string, customerEmail: string, errorMessage: string) {
  try {
    await createClient().from("email_failures").insert({
      access_code_id: accessCodeId,
      customer_email: customerEmail,
      error_message: errorMessage,
      retry_count: 0,
      resolved: false,
    })
  } catch (error) {
    console.error("Failed to log email failure:", error)
  }
}
