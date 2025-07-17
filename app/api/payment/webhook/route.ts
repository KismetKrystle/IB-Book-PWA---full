import { type NextRequest, NextResponse } from "next/server"
import { EnhancedDatabaseService, DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const eventType = payload.type
    const processor = request.headers.get("x-payment-processor") || payload.processor

    console.log(`Received webhook event: ${eventType} from ${processor}`)

    let transactionData = null

    // Parse webhook data based on processor
    switch (processor) {
      case "stripe":
        if (payload.type === "checkout.session.completed") {
          transactionData = {
            transaction_id: payload.data.object.payment_intent,
            payment_processor: "stripe",
            status: "completed",
            customer_email: payload.data.object.customer_details.email,
            customer_name: payload.data.object.customer_details.name,
            amount: payload.data.object.amount_total / 100, // Stripe uses cents
            currency: payload.data.object.currency.toUpperCase(),
            webhook_data: payload,
          }
        }
        break

      case "paypal":
        if (payload.event_type === "CHECKOUT.ORDER.APPROVED") {
          transactionData = {
            transaction_id: payload.resource.id,
            payment_processor: "paypal",
            status: "completed",
            customer_email: payload.resource.payer.email_address,
            customer_name: `${payload.resource.payer.name.given_name} ${payload.resource.payer.name.surname}`,
            amount: Number.parseFloat(payload.resource.purchase_units[0].amount.value),
            currency: payload.resource.purchase_units[0].amount.currency_code,
            webhook_data: payload,
          }
        }
        break

      case "wise":
        if (payload.data.resource.type === "transfer" && payload.data.resource.status === "outgoing_payment_sent") {
          transactionData = {
            transaction_id: payload.data.resource.id.toString(),
            payment_processor: "wise",
            status: "completed",
            customer_email: payload.data.resource.details.email,
            customer_name: payload.data.resource.details.name,
            amount: payload.data.resource.sourceValue,
            currency: payload.data.resource.sourceCurrency,
            webhook_data: payload,
          }
        }
        break

      default:
        // Demo mode - simulate successful payment
        transactionData = {
          transaction_id: `demo_${Date.now()}`,
          payment_processor: processor || "demo",
          status: "completed",
          customer_email: payload.customer_email || "demo@example.com",
          customer_name: payload.customer_name || "Demo Customer",
          amount: payload.amount || 19.99,
          currency: payload.currency || "USD",
          webhook_data: payload,
        }
    }

    if (!transactionData) {
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } =
      await EnhancedDatabaseService.createPaymentTransaction(transactionData)

    if (transactionError) {
      console.error("Failed to create transaction:", transactionError)
      return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
    }

    switch (eventType) {
      case "payment_succeeded":
        // Example: Handle a successful payment event
        const { paymentId, amount, currency, customerEmail, purchaseLinkId, transactionId } = payload.data // Assuming these fields are in your webhook payload

        // Create an access code for the customer
        const { data: accessCode, error: accessCodeError } = await DatabaseService.createAccessCode({
          type: "purchase",
          maxUses: 1, // Typically 1 use for a purchased code
          customerEmail: customerEmail,
          paymentId: paymentId,
          notes: `Generated from successful payment for link ${purchaseLinkId}`,
        })

        if (accessCodeError) {
          console.error("Error creating access code from webhook:", accessCodeError)
          // Log this as a system failure to be reviewed manually
          await DatabaseService.trackEvent("system_failure", {
            eventType: "access_code_creation_failed",
            metadata: {
              webhookPayload: payload,
              errorMessage: accessCodeError,
            },
          })
          return NextResponse.json({ message: "Access code creation failed" }, { status: 500 })
        }

        // Increment purchase count for the link
        if (purchaseLinkId) {
          await DatabaseService.incrementPurchaseLinkPurchase(purchaseLinkId)
          await DatabaseService.trackEvent("purchase_completed", {
            purchaseLinkId,
            accessCodeId: accessCode?.id,
            userEmail: customerEmail,
            metadata: { amount, currency, transactionId },
          })
        }

        console.log(`Payment succeeded for ${customerEmail}. Access code: ${accessCode?.code}`)

        // Update transaction with access code ID
        await EnhancedDatabaseService.updatePaymentTransaction(transaction!.id, {
          access_code_id: accessCode.id,
          completed_at: new Date().toISOString(),
        })

        break
      case "payment_failed":
        // Example: Handle a failed payment event
        console.error("Payment failed webhook received:", payload.data)
        // Log this for review
        await DatabaseService.trackEvent("payment_failed_webhook", {
          metadata: { webhookPayload: payload },
        })
        break
      // Add more cases for other event types as needed
      default:
        console.warn(`Unhandled webhook event type: ${eventType}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ message: "Error processing webhook" }, { status: 500 })
  }
}
