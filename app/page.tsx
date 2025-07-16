"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Mail } from "lucide-react"

export default function HomePage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"landing" | "payment" | "access" | "credentials">("landing")
  const [loading, setLoading] = useState(true)
  const [accessCode, setAccessCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
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

      if (token && userEmail && userPassword && authExpiry) {
        const expiryDate = new Date(authExpiry)
        if (expiryDate > new Date()) {
          window.location.href = "/flipbook"
          return
        } else {
          // Clear expired auth
          localStorage.removeItem("infiniteBloomToken")
          localStorage.removeItem("infiniteBloomEmail")
          localStorage.removeItem("infiniteBloomPassword")
          localStorage.removeItem("infiniteBloomAuthExpiry")
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

    // Redirect to admin dashboard as the main entry point
    // window.location.href = "/admin"
  }, [searchParams])

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 19.99 }),
      })

      const data = await response.json()

      if (data.success) {
        setAccessCode(data.accessCode)
        setStep("access")
        setDemoMode(true)
      }
    } catch (err) {
      setError("Payment failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAccessCode = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("infiniteBloomToken", data.sessionToken)
        setStep("credentials")
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError("Validation failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCredentialsSetup = () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    localStorage.setItem("infiniteBloomEmail", email)
    localStorage.setItem("infiniteBloomPassword", password)
    localStorage.setItem("infiniteBloomAuthExpiry", expiryDate.toISOString())
    localStorage.setItem("infiniteBloomLastAccess", new Date().toISOString())

    window.location.href = "/flipbook"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Redirecting to admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (step === "landing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-4xl font-bold">Infinite Bloom</CardTitle>
            <CardDescription className="mt-2 text-lg text-gray-600">
              Your journey into transformative poetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <p className="text-gray-700">
              Access the digital flipbook by entering your unique access code or purchasing a link.
            </p>
            <div className="flex flex-col space-y-3">
              <Button asChild className="w-full py-3 text-lg">
                <Link href="/pwa">Enter Access Code</Link>
              </Button>
              <Button asChild variant="outline" className="w-full py-3 text-lg bg-transparent">
                <Link href="/buy/main">Purchase Access</Link>
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
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg"
                autoComplete="off"
                autoFocus
                onClick={(e) => e.currentTarget.focus()}
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
              Back to Purchase
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
            <CardTitle className="text-xl">Create Your Account</CardTitle>
            <CardDescription>Set up your email and password to access The Infinite Bloom</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
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
              disabled={!email || !password}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              Enter The Infinite Bloom
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
