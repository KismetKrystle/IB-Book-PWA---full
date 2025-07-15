import { type NextRequest, NextResponse } from "next/server"
import { EnhancedDatabaseService } from "@/lib/enhanced-database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const processor = request.headers.get("x-payment-processor") || body.processor

    console.log(`Webhook received from ${processor}:`, body)

    let transactionData = null

    // Parse webhook data based on processor
    switch (processor) {
      case "stripe":
        if (body.type === "checkout.session.completed") {
          transactionData = {
            transaction_id: body.data.object.payment_intent,
            payment_processor: "stripe",
            status: "completed",
            customer_email: body.data.object.customer_details.email,
            customer_name: body.data.object.customer_details.name,
            amount: body.data.object.amount_total / 100, // Stripe uses cents
            currency: body.data.object.currency.toUpperCase(),
            webhook_data: body,
          }
        }
        break

      case "paypal":
        if (body.event_type === "CHECKOUT.ORDER.APPROVED") {
          transactionData = {
            transaction_id: body.resource.id,
            payment_processor: "paypal",
            status: "completed",
            customer_email: body.resource.payer.email_address,
            customer_name: `${body.resource.payer.name.given_name} ${body.resource.payer.name.surname}`,
            amount: Number.parseFloat(body.resource.purchase_units[0].amount.value),
            currency: body.resource.purchase_units[0].amount.currency_code,
            webhook_data: body,
          }
        }
        break

      case "wise":
        if (body.data.resource.type === "transfer" && body.data.resource.status === "outgoing_payment_sent") {
          transactionData = {
            transaction_id: body.data.resource.id.toString(),
            payment_processor: "wise",
            status: "completed",
            customer_email: body.data.resource.details.email,
            customer_name: body.data.resource.details.name,
            amount: body.data.resource.sourceValue,
            currency: body.data.resource.sourceCurrency,
            webhook_data: body,
          }
        }
        break

      default:
        // Demo mode - simulate successful payment
        transactionData = {
          transaction_id: `demo_${Date.now()}`,
          payment_processor: processor || "demo",
          status: "completed",
          customer_email: body.customer_email || "demo@example.com",
          customer_name: body.customer_name || "Demo Customer",
          amount: body.amount || 19.99,
          currency: body.currency || "USD",
          webhook_data: body,
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

    // Create access code for the customer
    const { data: accessCode, error: codeError } = await EnhancedDatabaseService.createAccessCode({
      type: "purchase",
      customer_name: transactionData.customer_name,
      customer_email: transactionData.customer_email,
      payment_processor: transactionData.payment_processor as "stripe" | "paypal" | "wise",
      transaction_id: transactionData.transaction_id,
      amount_paid: transactionData.amount,
      currency: transactionData.currency,
      purchase_link_id: body.purchase_link_id,
    })

    if (codeError || !accessCode) {
      console.error("Failed to create access code:", codeError)
      return NextResponse.json({ error: "Failed to generate access code" }, { status: 500 })
    }

    // TODO: Send email with access code
    console.log(`Access code ${accessCode.code} created for ${transactionData.customer_email}`)

    // Update transaction with access code ID
    await EnhancedDatabaseService.updatePaymentTransaction(transaction!.id, {
      access_code_id: accessCode.id,
      completed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      access_code: accessCode.code,
      transaction_id: transactionData.transaction_id,
    })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
