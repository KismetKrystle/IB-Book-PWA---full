import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const { accessCodeId, customerEmail, transactionId, amountPaid, currency, paymentProcessor } = await request.json()

  if (!accessCodeId || !customerEmail || !transactionId || !amountPaid || !currency || !paymentProcessor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createClient()

  try {
    const { data: accessCode, error: fetchError } = await supabase
      .from("access_codes")
      .select("*")
      .eq("id", accessCodeId)
      .single()

    if (fetchError || !accessCode) {
      console.error("Error fetching access code:", fetchError?.message || "Access code not found")
      return NextResponse.json({ error: "Access code not found" }, { status: 404 })
    }

    // Update access code with customer and payment info
    const { data: updatedCode, error: updateError } = await supabase
      .from("access_codes")
      .update({
        customer_email: customerEmail,
        transaction_id: transactionId,
        amount_paid: amountPaid,
        currency: currency,
        payment_processor: paymentProcessor,
        purchase_date: new Date().toISOString(),
        current_usage: (accessCode.current_usage || 0) + 1, // Increment usage
      })
      .eq("id", accessCodeId)
      .select()
      .single()

    if (updateError || !updatedCode) {
      console.error("Error updating access code:", updateError?.message || "Failed to update access code")
      return NextResponse.json({ error: "Failed to update access code" }, { status: 500 })
    }

    return NextResponse.json({ success: true, accessCode: updatedCode }, { status: 200 })
  } catch (error) {
    console.error("Unexpected error in create-payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
