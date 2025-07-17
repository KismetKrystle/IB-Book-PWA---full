"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, XCircle, CreditCard, ShoppingCartIcon as Paypal, Banknote, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PurchaseLink {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  description: string
  stripe_enabled: boolean
  paypal_enabled: boolean
  wise_enabled: boolean
  stripe_price_id?: string
  paypal_link?: string
  wise_link?: string
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = params.slug as string

  const [purchaseLink, setPurchaseLink] = useState<PurchaseLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPurchaseLink = async () => {
      try {
        const response = await fetch(`/api/payment/select?slug=${slug}`)
        const data = await response.json()

        if (response.ok && data.link) {
          setPurchaseLink(data.link)
        } else {
          setError(data.error || "Purchase link not found.")
        }
      } catch (err) {
        setError("Failed to load purchase link. Please try again.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchPurchaseLink()
    }
  }, [slug])

  const handleCheckout = async (paymentMethod: "stripe" | "paypal" | "wise") => {
    if (!purchaseLink) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseLinkId: purchaseLink.id,
          paymentMethod,
          // Pass other necessary data like price, currency, etc.
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout, PayPal, or Wise payment page
        window.location.href = data.url
      } else {
        setError(data.error || "Failed to initiate checkout.")
        toast({
          title: "Payment Error",
          description: data.error || "Could not start payment process.",
          variant: "destructive",
        })
      }
    } catch (err) {
      setError("An unexpected error occurred during checkout. Please try again.")
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        <p className="mt-4 text-lg text-gray-600">Loading payment options...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
        <p className="text-gray-600">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">
          Go Back
        </Button>
      </div>
    )
  }

  if (!purchaseLink) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Link Not Found</h1>
        <p className="text-gray-600">The purchase link you are looking for does not exist or is inactive.</p>
        <Button onClick={() => router.push("/pwa")} className="mt-6">
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">{purchaseLink.name}</CardTitle>
          <CardDescription className="text-gray-600">
            {purchaseLink.description || "Securely purchase access to The Infinite Bloom."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-purple-700">
              ${purchaseLink.price.toFixed(2)}{" "}
              <span className="text-2xl font-semibold text-gray-600">{purchaseLink.currency.toUpperCase()}</span>
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            {purchaseLink.stripe_enabled && (
              <Button
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => handleCheckout("stripe")}
                disabled={loading}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pay with Card (Stripe)
              </Button>
            )}
            {purchaseLink.paypal_enabled && (
              <Button
                className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                onClick={() => handleCheckout("paypal")}
                disabled={loading}
              >
                <Paypal className="mr-2 h-5 w-5" />
                Pay with PayPal
              </Button>
            )}
            {purchaseLink.wise_enabled && (
              <Button
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                onClick={() => handleCheckout("wise")}
                disabled={loading}
              >
                <Banknote className="mr-2 h-5 w-5" />
                Pay with Wise
              </Button>
            )}
            {!purchaseLink.stripe_enabled && !purchaseLink.paypal_enabled && !purchaseLink.wise_enabled && (
              <p className="text-center text-gray-500">No payment methods enabled for this link.</p>
            )}
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>Your purchase grants you access to the full content of The Infinite Bloom.</p>
            <p className="mt-2">
              By proceeding, you agree to our{" "}
              <a href="#" className="underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
