"use client"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PurchaseLink {
  id: string
  slug: string
  price: number
  currency: string
  description: string
  created_at: string
  is_active: boolean
  stripe_price_id?: string
  paypal_link?: string
  wise_link?: string
  is_free: boolean
}

async function getPurchaseLink(linkId: string): Promise<PurchaseLink | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("purchase_links").select("*").eq("slug", linkId).single()

  if (error) {
    console.error("Error fetching purchase link:", error.message)
    return null
  }
  return data
}

export default async function BuyPage({ params }: { params: { linkId: string } }) {
  const link = await getPurchaseLink(params.linkId)

  if (!link || !link.is_active) {
    notFound()
  }

  const handleStripeCheckout = async () => {
    if (!link.stripe_price_id) {
      alert("Stripe is not configured for this link.")
      return
    }
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId: link.stripe_price_id }),
      })
      const { url, error } = await res.json()
      if (error) {
        alert(`Error: ${error}`)
      } else if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Error initiating Stripe checkout:", error)
      alert("Failed to initiate checkout. Please try again.")
    }
  }

  const handleFreeAccess = async () => {
    // For free links, we might automatically generate an access code or redirect
    // For now, let's simulate granting access and redirect to PWA
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCodeId: link.id, // Using link ID as a placeholder for a free access code ID
          customerEmail: "free_user@example.com", // Placeholder email
          transactionId: `FREE-${Math.random().toString(36).substring(2, 10)}`,
          amountPaid: 0,
          currency: "USD",
          paymentProcessor: "Free Access",
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Redirect to PWA reader with a session token or direct access
        window.location.href = `/pwa/reader?session=${data.accessCode.code}` // Use the generated code as a session
      } else {
        alert(`Failed to grant free access: ${data.message || data.error}`)
      }
    } catch (error) {
      console.error("Error granting free access:", error)
      alert("Failed to grant free access. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{link.slug}</CardTitle>
          <CardDescription className="mt-2 text-lg text-gray-600">{link.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {link.is_free ? (
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">Free Access</p>
              <Button onClick={handleFreeAccess} className="mt-6 w-full py-3 text-lg">
                Get Free Access
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-4xl font-extrabold text-gray-900">
                  ${link.price.toFixed(2)}{" "}
                  <span className="text-xl font-semibold text-gray-500">{link.currency.toUpperCase()}</span>
                </p>
              </div>

              <div className="space-y-4">
                {link.stripe_price_id && (
                  <Button onClick={handleStripeCheckout} className="w-full py-3 text-lg">
                    Pay with Card (Stripe)
                  </Button>
                )}
                {link.paypal_link && (
                  <Button asChild variant="outline" className="w-full py-3 text-lg bg-transparent">
                    <a href={link.paypal_link} target="_blank" rel="noopener noreferrer">
                      Pay with PayPal
                    </a>
                  </Button>
                )}
                {link.wise_link && (
                  <Button asChild variant="outline" className="w-full py-3 text-lg bg-transparent">
                    <a href={link.wise_link} target="_blank" rel="noopener noreferrer">
                      Pay with Wise
                    </a>
                  </Button>
                )}
                {!link.stripe_price_id && !link.paypal_link && !link.wise_link && (
                  <p className="text-center text-red-500">No payment methods configured for this link.</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
