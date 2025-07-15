"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, BookOpen, Headphones, Infinity, Download, Smartphone } from "lucide-react"
import { useParams } from "next/navigation"

interface ShareableLink {
  id: string
  name: string
  price: number
  description: string
  createdAt: string
  expiresAt?: string
  active: boolean
}

export default function BuyPage() {
  const params = useParams()
  const linkId = params.linkId as string
  const [link, setLink] = useState<ShareableLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    // Load link details - for demo, we'll use hardcoded data
    const loadLink = () => {
      const demoLinks: ShareableLink[] = [
        {
          id: "DEMO001",
          name: "The Infinite Bloom",
          price: 19.99,
          description:
            "Experience transformative poetry that evolves your perspective on life, love, and consciousness.",
          createdAt: new Date().toISOString(),
          active: true,
        },
        {
          id: "PROMO001",
          name: "The Infinite Bloom - Holiday Special",
          price: 14.99,
          description: "Limited time holiday offer - Experience transformative poetry at a special price.",
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          active: true,
        },
      ]

      const foundLink = demoLinks.find((l) => l.id === linkId)

      if (foundLink) {
        // Check if expired
        if (foundLink.expiresAt && new Date(foundLink.expiresAt) < new Date()) {
          setError("This link has expired")
        } else if (!foundLink.active) {
          setError("This link is no longer active")
        } else {
          setLink(foundLink)
        }
      } else {
        // Default link for any ID
        setLink({
          id: linkId,
          name: "The Infinite Bloom",
          price: 19.99,
          description:
            "Experience transformative poetry that evolves your perspective on life, love, and consciousness.",
          createdAt: new Date().toISOString(),
          active: true,
        })
      }
      setLoading(false)
    }

    if (linkId) {
      loadLink()
    }
  }, [linkId])

  const handlePurchase = async () => {
    setPurchasing(true)
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate access code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      setAccessCode(code)
      setPurchased(true)
    } catch (err) {
      setError("Payment failed. Please try again.")
    } finally {
      setPurchasing(false)
    }
  }

  const handleInstallPWA = () => {
    // Redirect to main app with access code
    window.location.href = `/?code=${accessCode}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              Go to Main Site
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (purchased) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Download className="w-12 h-12 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Purchase Complete!</CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">Your access code is ready</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
              <p className="text-sm text-green-700 mb-2">Your Access Code:</p>
              <p className="font-mono text-2xl font-bold text-green-800 mb-3">{accessCode}</p>
              <p className="text-xs text-green-600">Save this code - you'll need it to access your book</p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-2">Next Steps:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4" />
                    <span>Install the app on your device</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Use your access code to sign in</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Headphones className="w-4 h-4" />
                    <span>Enjoy offline reading with audio</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleInstallPWA}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-lg py-3"
              >
                Install App & Start Reading
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  The app works on up to 3 devices and includes lifetime offline access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-400 via-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg">
            <Infinity className="w-12 h-12 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">{link?.name}</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">Evolving by Perspective</CardDescription>
            <p className="text-sm text-gray-500 mt-1">by Kismet Krystle</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>45 Poems</span>
            </div>
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4" />
              <span>Audio Included</span>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-700">{link?.description}</p>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <p className="text-3xl font-bold text-gray-800">${link?.price}</p>
              <p className="text-sm text-gray-600">One-time purchase • Up to 3 devices • Lifetime offline access</p>
            </div>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={purchasing}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 text-lg"
          >
            {purchasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              "Purchase & Install App"
            )}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">Secure payment • Instant access • Works offline</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
