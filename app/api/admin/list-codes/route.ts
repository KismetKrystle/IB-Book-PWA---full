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
      // Try to fetch from Supabase with the correct column names
      const { data: codes, error } = await supabaseAdmin
        .from("access_codes")
        .select(`
          id,
          code,
          type,
          customer_name,
          customer_email,
          payment_processor,
          transaction_id,
          amount_paid,
          currency,
          payment_date,
          max_uses,
          current_uses,
          devices,
          active,
          expires_at,
          notes,
          created_at,
          created_by
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      console.log(`Successfully loaded ${codes?.length || 0} access codes`)

      // Transform the data to match our interface
      const transformedCodes =
        codes?.map((code) => ({
          id: code.id,
          code: code.code,
          type: code.type,
          customerName: code.customer_name,
          customerEmail: code.customer_email,
          paymentProcessor: code.payment_processor,
          transactionId: code.transaction_id,
          amountPaid: code.amount_paid,
          currency: code.currency || "USD",
          paymentDate: code.payment_date,
          maxUses: code.max_uses,
          currentUses: code.current_uses,
          devices: Array.isArray(code.devices) ? code.devices.length : 0,
          active: code.active,
          expiresAt: code.expires_at,
          notes: code.notes,
          createdAt: code.created_at,
          createdBy: code.created_by,
        })) || []

      return NextResponse.json({
        success: true,
        codes: transformedCodes,
      })
    } catch (dbError) {
      console.error("Database connection error:", dbError)

      // Return demo data if database is unavailable
      const demoAccessCodes = [
        {
          id: "demo1",
          code: "DEMO123",
          type: "promotional",
          customerName: "Demo User",
          customerEmail: "demo@example.com",
          maxUses: 3,
          currentUses: 1,
          devices: 1,
          active: true,
          currency: "USD",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "admin",
          notes: "Demo promotional code",
        },
        {
          id: "demo2",
          code: "PROMO2024",
          type: "promotional",
          customerName: "Test Customer",
          customerEmail: "test@example.com",
          maxUses: 3,
          currentUses: 0,
          devices: 0,
          active: true,
          currency: "USD",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "admin",
          notes: "New Year promotional code",
        },
        {
          id: "purchase1",
          code: "PUR8X9K2",
          type: "purchase",
          customerName: "John Doe",
          customerEmail: "john@example.com",
          paymentProcessor: "stripe",
          transactionId: "pi_test_123456789",
          amountPaid: 19.99,
          currency: "USD",
          paymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          maxUses: 3,
          currentUses: 2,
          devices: 2,
          active: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: "stripe_webhook",
        },
      ]

      return NextResponse.json({
        success: true,
        codes: demoAccessCodes,
        warning: "Using demo data - database connection failed",
      })
    }
  } catch (error) {
    console.error("List codes error:", error)
    return NextResponse.json(
      {
        error: "Failed to list access codes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
