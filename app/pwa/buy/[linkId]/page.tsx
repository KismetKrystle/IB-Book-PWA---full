"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, DollarSign, Clock, Eye, Gift } from "lucide-react"
import { PreviewViewer } from "@/components/preview-viewer"

interface PurchaseLink {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  description: string
  active: boolean
  hasExpiration: boolean
  expiresAt?: string
  stripeEnabled: boolean
  paypalEnabled: boolean
  wiseEnabled: boolean
  stripePriceId?: string
  paypalLink?: string
  wiseLink?: string
  previewEnabled: boolean
  previewPages: number[]
}

export default function PurchasePage() {
  const params = useParams()
  const linkId = params.linkId as string
  const [purchaseLink, setPurchaseLink] = useState<PurchaseLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (linkId) {
      loadPurchaseLink(linkId)
    }
  }, [linkId])

  const loadPurchaseLink = async (slug: string) => {
    setLoading(true)
    setError("")

    try {
      // For demo purposes, return mock data based on slug
      let mockLink: PurchaseLink

      if (slug === "the-infinite-bloom") {
        mockLink = {
          id: "main",
          name: "The Infinite Bloom - Standard",
          slug: "the-infinite-bloom",
          price: 19.99,
          currency: "USD",
          description:
            "Experience a transformative journey through poetry and self-discovery. This digital collection includes 50+ pages of carefully curated poems, reflections, and interactive elements designed to inspire personal growth.",
          active: true,
          hasExpiration: false,
          stripeEnabled: true,
          paypalEnabled: true,
          wiseEnabled: true,
          stripePriceId: "price_1234567890",
          paypalLink: "https://paypal.me/demo-main-product",
          wiseLink: "https://wise.com/pay/demo-main-product",
          previewEnabled: true,
          previewPages: [9, 10, 11, 12],
        }
      } else if (slug === "holiday-special") {
        mockLink = {
          id: "holiday",
          name: "Holiday Special - 25% Off",
          slug: "holiday-special",
          price: 14.99,
          currency: "USD",
          description:
            "Limited time holiday offer - Experience transformative poetry at a special price. Same content as the standard edition but with seasonal savings.",
          active: true,
          hasExpiration: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripeEnabled: true,
          paypalEnabled: true,
          wiseEnabled: false,
          stripePriceId: "price_0987654321",
          paypalLink: "https://paypal.me/demo-holiday-special",
          previewEnabled: true,
          previewPages: [1, 2, 9, 10],
        }
      } else if (slug === "free-preview") {
        mockLink = {
          id: "free",
          name: "Free Preview Access",
          slug: "free-preview",
          price: 0.0,
          currency: "USD",
          description:
            "Complimentary access to selected pages of The Infinite Bloom. Perfect for getting a taste of the transformative content before making a purchase.",
          active: true,
          hasExpiration: false,
          stripeEnabled: false,
          paypalEnabled: false,
          wiseEnabled: false,
          previewEnabled: true,
          previewPages: [1, 2, 3, 4, 5],
        }
      } else {
        throw new Error("Purchase link not found")
      }

      setPurchaseLink(mockLink)
    } catch (err) {
      setError("Purchase link not found or has expired")
    } finally {
      setLoading(false)
    }
  }

  const handleStripeCheckout = async () => {
    if (!purchaseLink?.stripePriceId) return

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: purchaseLink.stripePriceId,
          purchaseLinkId: purchaseLink.id,
        }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Stripe checkout error:", error)
      alert("Failed to start checkout process")
    }
  }

  const handlePayPalPayment = () => {
    if (purchaseLink?.paypalLink) {
      window.open(purchaseLink.paypalLink, "_blank")
    }
  }

  const handleWisePayment = () => {
    if (purchaseLink?.wiseLink) {
      window.open(purchaseLink.wiseLink, "_blank")
    }
  }

  const handleFreeAccess = () => {
    // For free access, redirect directly to PWA with a demo code
    window.location.href = "/pwa?code=FREE2024"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading purchase details...</p>
        </div>
      </div>
    )
  }

  if (error || !purchaseLink) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "This purchase link is not available."}</p>
            <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!purchaseLink.active) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unavailable</h1>
            <p className="text-gray-600 mb-6">This purchase link is currently inactive.</p>
            <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (purchaseLink.hasExpiration && purchaseLink.expiresAt && new Date(purchaseLink.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Expired</h1>
            <p className="text-gray-600 mb-6">This purchase link has expired.</p>
            <Button onClick={() => (window.location.href = "/")}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{purchaseLink.name}</CardTitle>
                  {purchaseLink.hasExpiration && purchaseLink.expiresAt && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Expires {new Date(purchaseLink.expiresAt).toLocaleDateString()}</span>
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-lg">{purchaseLink.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-3xl font-bold">
                      {purchaseLink.price === 0 ? "FREE" : `$${purchaseLink.price.toFixed(2)}`}
                    </span>
                    {purchaseLink.price > 0 && <span className="text-gray-500">{purchaseLink.currency}</span>}
                  </div>
                </div>

                {purchaseLink.previewEnabled && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      className="w-full flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview Content</span>
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">What's Included:</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• 50+ pages of transformative poetry</li>
                    <li>• Interactive reflection exercises</li>
                    <li>• Personal growth insights</li>
                    <li>• Offline reading capability</li>
                    <li>• Multi-device access (up to 3 devices)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {purchaseLink.price === 0 ? (
                    <>
                      <Gift className="w-5 h-5" />
                      <span>Get Free Access</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Choose Payment Method</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {purchaseLink.price === 0
                    ? "Click below to get instant free access"
                    : "Select your preferred payment option"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchaseLink.price === 0 ? (
                  <Button onClick={handleFreeAccess} className="w-full" size="lg">
                    <Gift className="w-4 h-4 mr-2" />
                    Get Free Access
                  </Button>
                ) : (
                  <>
                    {purchaseLink.stripeEnabled && (
                      <Button onClick={handleStripeCheckout} className="w-full" size="lg">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay with Card (Stripe)
                      </Button>
                    )}

                    {purchaseLink.paypalEnabled && (
                      <Button
                        onClick={handlePayPalPayment}
                        variant="outline"
                        className="w-full bg-transparent"
                        size="lg"
                      >
                        Pay with PayPal
                      </Button>
                    )}

                    {purchaseLink.wiseEnabled && (
                      <Button onClick={handleWisePayment} variant="outline" className="w-full bg-transparent" size="lg">
                        Pay with Wise
                      </Button>
                    )}
                  </>
                )}

                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>Secure payment • Instant access • 30-day guarantee</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">How many devices can I use?</h4>
                  <p className="text-sm text-gray-600">Up to 3 devices with your access code.</p>
                </div>
                <div>
                  <h4 className="font-medium">Can I read offline?</h4>
                  <p className="text-sm text-gray-600">Yes, content is available offline after first download.</p>
                </div>
                <div>
                  <h4 className="font-medium">What if I have issues?</h4>
                  <p className="text-sm text-gray-600">Contact support for help with access or technical issues.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && purchaseLink.previewEnabled && (
        <PreviewViewer pages={purchaseLink.previewPages} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
