"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, BookOpen, Headphones, Infinity, Eye, EyeOff, Mail, User, Phone } from "lucide-react"

interface PurchaseLink {
  id: string
  name: string
  slug: string
  price: number
  description: string
  isDefault: boolean
  active: boolean
}

export default function PWAHomePage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"landing" | "payment" | "access" | "credentials">("landing")
  const [loading, setLoading] = useState(true)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [demoMode, setDemoMode] = useState(false)
  const [defaultLink, setDefaultLink] = useState<PurchaseLink | null>(null)

  // Available purchase links as buttons
  const [purchaseLinks] = useState<PurchaseLink[]>([
    {
      id: "main",
      name: "The Infinite Bloom - Standard",
      slug: "the-infinite-bloom",
      price: 19.99,
      description:
        "Experience a transformative journey through poetry that evolves your perspective on life, love, and consciousness.",
      isDefault: true,
      active: true,
    },
    {
      id: "holiday",
      name: "Holiday Special - 25% Off",
      slug: "holiday-special",
      price: 14.99,
      description: "Limited time holiday offer - Experience transformative poetry at a special price.",
      isDefault: false,
      active: true,
    },
    {
      id: "premium",
      name: "Premium Package",
      slug: "premium-package",
      price: 29.99,
      description: "Premium access with exclusive bonus content and early access to new releases.",
      isDefault: false,
      active: true,
    },
  ])

  useEffect(() => {
    // Load default purchase link
    const loadDefaultLink = () => {
      const defaultPurchaseLink = purchaseLinks.find((link) => link.isDefault && link.active)
      if (defaultPurchaseLink) {
        setDefaultLink(defaultPurchaseLink)
      } else {
        const firstActiveLink = purchaseLinks.find((link) => link.active)
        if (firstActiveLink) {
          setDefaultLink(firstActiveLink)
        }
      }
    }

    loadDefaultLink()

    // Check for access code from URL
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setAccessCode(codeFromUrl)
      setStep("access")
      setDemoMode(true)
    }

    // Check if user is already authenticated
    const checkAuth = () => {
      const token = localStorage.getItem("infiniteBloomToken")
      const userEmail = localStorage.getItem("infiniteBloomEmail")
      const userPassword = localStorage.getItem("infiniteBloomPassword")
      const authExpiry = localStorage.getItem("infiniteBloomAuthExpiry")

      // Ensure all required data is present, especially email
      if (token && userEmail && userEmail.includes("@") && userPassword && authExpiry) {
        const expiryDate = new Date(authExpiry)
        if (expiryDate > new Date()) {
          window.location.href = "/pwa/reader"
          return
        } else {
          // Clear expired auth but preserve email for re-login
          const savedEmail = userEmail
          localStorage.clear()
          localStorage.setItem("infiniteBloomEmail", savedEmail)
        }
      }
      setLoading(false)
    }

    if (!codeFromUrl) {
      checkAuth()
    } else {
      setLoading(false)
    }

    // Try to register service worker, but don't fail if it doesn't work
    if ("serviceWorker" in navigator && typeof window !== "undefined") {
      setTimeout(() => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("Service Worker registered successfully:", registration.scope)
          })
          .catch((error) => {
            console.log("Service Worker registration failed (this is OK in preview):", error.message)
            localStorage.setItem("offlineCacheEnabled", "true")
          })
      }, 1000)
    }
  }, [searchParams, purchaseLinks])

  const handlePurchaseLink = (slug: string) => {
    window.location.href = `/pwa/buy/${slug}`
  }

  const handleAccessCode = async () => {
    setLoading(true)
    setError("")

    if (!accessCode || accessCode.length < 3) {
      setError("Please enter a valid access code")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: accessCode.trim().toUpperCase(),
          deviceFingerprint: Math.random().toString(36).substring(2, 15),
        }),
      })

      const data = await response.json()
      console.log("Validation response:", data) // Debug log

      if (data.success) {
        localStorage.setItem("infiniteBloomToken", data.sessionToken)
        localStorage.setItem("infiniteBloomAccessCode", accessCode.trim().toUpperCase())
        setStep("credentials")
        setError("") // Clear any previous errors
      } else {
        setError(data.message || "Invalid access code")
      }
    } catch (err) {
      console.error("Validation error:", err)
      setError("Validation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCredentialsSetup = async () => {
    console.log("handleCredentialsSetup called", { userName, email, password, phoneNumber }) // Debug log

    setError("")
    setCredentialsLoading(true)

    // Validation
    if (!userName || userName.trim().length < 2) {
      setError("Please enter your full name")
      setCredentialsLoading(false)
      return
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      setCredentialsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setCredentialsLoading(false)
      return
    }

    try {
      // Simulate a brief delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))

      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)

      // Store all user data with timestamps
      localStorage.setItem("infiniteBloomUserName", userName.trim())
      localStorage.setItem("infiniteBloomEmail", email)
      localStorage.setItem("infiniteBloomPassword", password)
      localStorage.setItem("infiniteBloomPhoneNumber", phoneNumber.trim())
      localStorage.setItem("infiniteBloomAuthExpiry", expiryDate.toISOString())
      localStorage.setItem("infiniteBloomLastAccess", new Date().toISOString())
      localStorage.setItem("infiniteBloomRegisteredAt", new Date().toISOString())
      localStorage.setItem("infiniteBloomTheme", "light") // Default theme

      console.log("Credentials saved, redirecting to reader...") // Debug log

      // Redirect to reader
      window.location.href = "/pwa/reader"
    } catch (err) {
      console.error("Credentials setup error:", err)
      setError("Failed to set up account. Please try again.")
      setCredentialsLoading(false)
    }
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.focus()
    e.target.select()
  }

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.focus()
    e.currentTarget.select()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (step === "credentials" && userName && email && password && !credentialsLoading) {
        handleCredentialsSetup()
      } else if (step === "access" && accessCode.length >= 3 && !loading) {
        handleAccessCode()
      }
    }
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

  if (step === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-400 via-blue-400 to-teal-400 rounded-full flex items-center justify-center shadow-lg">
              <Infinity className="w-12 h-12 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">The Infinite Bloom</CardTitle>
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
              <p className="text-gray-700">
                Experience a transformative journey through poetry that evolves your perspective on life, love, and
                consciousness.
              </p>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Choose Your Package:</h3>
                {purchaseLinks
                  .filter((link) => link.active)
                  .map((link) => (
                    <Button
                      key={link.id}
                      onClick={() => handlePurchaseLink(link.slug)}
                      className={`w-full py-4 text-left justify-between ${
                        link.isDefault
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                          : "bg-white border-2 border-purple-200 hover:border-purple-400 text-gray-800"
                      }`}
                      variant={link.isDefault ? "default" : "outline"}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{link.name}</div>
                        <div className="text-sm opacity-90">{link.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">${link.price}</div>
                        {link.isDefault && <div className="text-xs">Most Popular</div>}
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            <div className="text-center">
              <Button variant="link" onClick={() => setStep("access")} className="text-sm text-gray-500">
                Already have an access code?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "access") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enter Access Code</CardTitle>
            <CardDescription>
              {demoMode ? "Use your access code below:" : "Enter the access code you received after purchase"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                  setAccessCode(value)
                }}
                onFocus={handleInputFocus}
                onClick={handleInputClick}
                onKeyPress={handleKeyPress}
                className="text-center font-mono text-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                maxLength={12}
                style={{
                  WebkitUserSelect: "text",
                  userSelect: "text",
                  WebkitTouchCallout: "default",
                  WebkitTapHighlightColor: "transparent",
                }}
              />
              <p className="text-xs text-gray-500">Try: DEMO123 or PROMO2024</p>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              onClick={handleAccessCode}
              disabled={loading || !accessCode}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate Code"
              )}
            </Button>

            <Button variant="link" onClick={() => setStep("landing")} className="w-full text-sm">
              Back to Purchase Options
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "credentials") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Complete Your Profile</CardTitle>
            <CardDescription>Set up your account details to access The Infinite Bloom</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="userName"
                  type="text"
                  placeholder="Your full name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={credentialsLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={credentialsLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={credentialsLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-10"
                  disabled={credentialsLoading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={credentialsLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Minimum 6 characters • You'll stay signed in for 30 days</p>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              onClick={handleCredentialsSetup}
              disabled={!userName || !email || !password || credentialsLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {credentialsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                "Enter The Infinite Bloom"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setStep("access")}
                className="text-sm text-gray-500"
                disabled={credentialsLoading}
              >
                Back to Access Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
