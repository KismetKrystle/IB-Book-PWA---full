"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, ArrowLeft, Shield, CheckCircle, Mail, User, DollarSign } from "lucide-react"

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
}

export default function PaymentPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [purchaseLink, setPurchaseLink] = useState<PurchaseLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedProcessor, setSelectedProcessor] = useState<string>("")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [status, setStatus] = useState<"success" | "cancelled" | "loading" | "error">("loading")
  const [message, setMessage] = useState("Processing your payment...")

  useEffect(() => {
    const paymentStatus = searchParams.get("payment")
    if (paymentStatus === "success") {
      setStatus("success")
      setMessage("Payment successful! You can now access the content.")
      // Optionally, trigger backend logic to finalize access code creation/activation
      // and then redirect to the reader.
      setTimeout(() => {
        router.push("/pwa/reader")
      }, 3000)
    } else if (paymentStatus === "cancelled") {
      setStatus("cancelled")
      setMessage("Payment cancelled. You can try again or return to the homepage.")
    } else {
      setStatus("error")
      setMessage("Invalid payment status. Please return to the homepage.")
    }
  }, [searchParams, router])

  useEffect(() => {
    if (status === "loading") {
      loadPurchaseLink()
    }
  }, [slug, status])

  const loadPurchaseLink = async () => {
    try {
      // In production, this would fetch from your API
      // For demo, we'll use mock data
      const mockLinks: PurchaseLink[] = [
        {
          id: "main",
          name: "The Infinite Bloom",
          slug: "the-infinite-bloom",
          price: 19.99,
          currency: "USD",
          description: "Experience a transformative journey through poetry",
          stripe_enabled: true,
          paypal_enabled: true,
          wise_enabled: true,
        },
        {
          id: "holiday",
          name: "Holiday Special",
          slug: "holiday-special",
          price: 14.99,
          currency: "USD",
          description: "Limited time holiday offer",
          stripe_enabled: true,
          paypal_enabled: true,
          wise_enabled: false,
        },
      ]

      const link = mockLinks.find((l) => l.slug === slug)
      if (link) {
        setPurchaseLink(link)
        // Auto-select first available processor
        if (link.stripe_enabled) setSelectedProcessor("stripe")
        else if (link.paypal_enabled) setSelectedProcessor("paypal")
        else if (link.wise_enabled) setSelectedProcessor("wise")
      } else {
        setError("Purchase link not found")
      }
    } catch (err) {
      setError("Failed to load purchase details")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!customerName || !customerEmail || !selectedProcessor) {
      setError("Please fill in all required fields")
      return
    }

    if (!customerEmail.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setProcessing(true)
    setError("")

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Simulate webhook call to create access code
      const webhookResponse = await fetch("/api/payment/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processor: selectedProcessor,
          customer_email: customerEmail,
          customer_name: customerName,
          amount: purchaseLink?.price,
          currency: purchaseLink?.currency,
          purchase_link_id: purchaseLink?.id,
          // Simulate transaction data
          transaction_id: `${selectedProcessor}_${Date.now()}`,
          status: "completed",
        }),
      })

      const webhookData = await webhookResponse.json()

      if (webhookData.success) {
        setAccessCode(webhookData.access_code)
        setSuccess(true)
      } else {
        throw new Error(webhookData.error)
      }
    } catch (err) {
      setError("Payment processing failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Payment Successful!</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">Your access code is ready</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700 mb-2">Your Access Code:</p>
              <p className="font-mono text-2xl font-bold text-green-800 mb-3">{accessCode}</p>
              <p className="text-xs text-green-600">This code has been sent to your email</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Next Steps:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>1. Check your email for the access code</p>
                <p>2. Use the code to sign in to the app</p>
                <p>3. Install the PWA for offline reading</p>
                <p>4. Enjoy your poetry collection!</p>
              </div>
            </div>

            <Button
              onClick={() => (window.location.href = `/pwa?code=${accessCode}`)}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500"
            >
              Continue to App
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "cancelled") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{message}</p>
            <Button onClick={() => router.back()} variant="outline" className="w-full py-3 text-lg">
              Try Payment Again
            </Button>
            <Button onClick={() => router.push("/")} className="w-full py-3 text-lg mt-2">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{message}</p>
            <Button onClick={() => router.push("/")} className="w-full py-3 text-lg">
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (!purchaseLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error || "Purchase link not found"}</p>
            <Button onClick={() => (window.location.href = "/pwa")} variant="outline">
              Back to Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Complete Your Purchase</h1>
            <p className="text-gray-600">Secure checkout for {purchaseLink.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Summary */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{purchaseLink.name}</h3>
                    <p className="text-sm text-gray-600">{purchaseLink.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${purchaseLink.price}</p>
                    <p className="text-xs text-gray-500">{purchaseLink.currency}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>
                  ${purchaseLink.price} {purchaseLink.currency}
                </span>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment • Instant access • 30-day guarantee</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerName"
                      type="text"
                      placeholder="John Smith"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-10"
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="pl-10"
                      disabled={processing}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Your access code will be sent to this email</p>
                </div>
              </div>

              <Separator />

              {/* Payment Method Selection */}
              <div className="space-y-4">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 gap-3">
                  {purchaseLink.stripe_enabled && (
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProcessor === "stripe"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedProcessor("stripe")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-gray-500">Powered by Stripe</p>
                          </div>
                        </div>
                        {selectedProcessor === "stripe" && <Badge variant="default">Selected</Badge>}
                      </div>
                    </div>
                  )}

                  {purchaseLink.paypal_enabled && (
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProcessor === "paypal"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedProcessor("paypal")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">PP</span>
                          </div>
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-gray-500">Pay with PayPal balance or card</p>
                          </div>
                        </div>
                        {selectedProcessor === "paypal" && <Badge variant="default">Selected</Badge>}
                      </div>
                    </div>
                  )}

                  {purchaseLink.wise_enabled && (
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedProcessor === "wise"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedProcessor("wise")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xs">W</span>
                          </div>
                          <div>
                            <p className="font-medium">Wise</p>
                            <p className="text-sm text-gray-500">International bank transfer</p>
                          </div>
                        </div>
                        {selectedProcessor === "wise" && <Badge variant="default">Selected</Badge>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">{error}</div>
              )}

              <Button
                onClick={handlePayment}
                disabled={processing || !customerName || !customerEmail || !selectedProcessor}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-lg py-3"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay $${purchaseLink.price} ${purchaseLink.currency}`
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By completing this purchase, you agree to our terms of service and privacy policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
