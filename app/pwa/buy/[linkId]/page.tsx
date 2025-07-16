"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

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

export default function PWABuyPage({ params }: { params: { linkId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [link, setLink] = useState<PurchaseLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await fetch(`/api/payment/select?linkId=${params.linkId}`)
        if (!res.ok) {
          throw new Error("Failed to fetch purchase link")
        }
        const data = await res.json()
        setLink(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [params.linkId])

  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    if (paymentStatus === "success") {
      alert("Payment successful! You can now access the content.")
      router.push("/pwa") // Redirect to PWA home or reader
    } else if (paymentStatus === "cancelled") {
      alert("Payment cancelled. You can try again.")
    }
  }, [searchParams, router])

  const handleStripeCheckout = async () => {
    if (!link?.stripe_price_id) {
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
    if (!link) return

    try {
      // Simulate creating a free access code and granting access
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCodeId: link.id, // Use the link ID as a placeholder for the access code ID
          customerEmail: "free_user@example.com", // Placeholder email
          transactionId: `FREE-${Math.random().toString(36).substring(2, 10)}`,
          amountPaid: 0,
          currency: "USD",
          paymentProcessor: "Free Access",
        }),
      })

      const data = await res.json()
      if (data.success) {
        // Store session token and redirect to PWA reader
        localStorage.setItem("sessionToken", data.accessCode.code)
        router.push("/pwa/reader")
      } else {
        alert(`Failed to grant free access: ${data.message || data.error}`)
      }
    } catch (error) {
      console.error("Error granting free access:", error)
      alert("Failed to grant free access. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    )
  }

  if (error || !link || !link.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Link Not Found</CardTitle>
            <CardDescription className="mt-2 text-lg text-red-600">
              The purchase link is invalid or inactive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    )
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
