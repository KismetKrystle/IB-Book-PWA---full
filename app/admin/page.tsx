import { headers } from "next/headers"
import { AdminDashboard } from "@/components/admin-dashboard" // Corrected import path
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const headersList = headers()
  const authHeader = headersList.get("authorization")

  // Basic authentication check for the admin dashboard
  // In a real application, you'd use a more robust authentication system (e.g., NextAuth.js, Clerk, Supabase Auth)
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN

  if (!ADMIN_TOKEN) {
    console.error("ADMIN_TOKEN environment variable is not set.")
    // In production, you might want to redirect to an error page or show a generic message
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-500">Server configuration error: ADMIN_TOKEN is missing.</p>
      </div>
    )
  }

  // Check for a simple token in the Authorization header
  // For a more secure setup, consider a proper login flow and session management
  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== ADMIN_TOKEN) {
    // If not authenticated, redirect to a login page or show an unauthorized message
    // For simplicity, we'll just show a basic login form here.
    // In a real app, you'd have a dedicated login route.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <form action="/api/admin/login" method="POST" className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-500">
            This is a basic authentication for demonstration.
            <br />
            Use the `ADMIN_TOKEN` as password.
          </p>
        </div>
      </div>
    )
  }

  // If authenticated, render the Admin Dashboard client component
  return <AdminDashboard />
}
;("use client")

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Loader2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  QrCode,
  Gift,
  TrendingUp,
  DollarSign,
  MousePointer,
  ShoppingCart,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  Users,
  AlertCircle,
  CreditCard,
  FileText,
  Calendar,
} from "lucide-react"

// Update the PurchaseLink interface to include Stripe price ID
interface PurchaseLink {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  description: string
  createdAt: string
  expiresAt?: string
  hasExpiration: boolean
  clicks: number
  purchases: number
  revenue: number
  active: boolean
  isDefault: boolean
  stripeEnabled: boolean
  paypalEnabled: boolean
  wiseEnabled: boolean
  stripePriceId?: string
  paypalLink?: string
  wiseLink?: string
  previewEnabled: boolean
  previewPages: number[]
}

interface AccessCode {
  id: string
  code: string
  type: "purchase" | "promotional" | "manual"
  customerName?: string
  customerEmail?: string
  paymentProcessor?: string
  transactionId?: string
  amountPaid?: number
  currency?: string
  paymentDate?: string
  maxUses: number
  currentUses: number
  devices: number // Number of devices, not array
  active: boolean
  expiresAt?: string
  notes?: string
  createdAt: string
  createdBy: string
}

interface SystemFailure {
  id: string
  type: "webhook" | "email"
  description: string
  errorMessage: string
  retryCount: number
  resolved: boolean
  createdAt: string
  customerEmail?: string
  sessionId?: string
}

export function AdminDashboardComponent() {
  const [mounted, setMounted] = useState(false)
  const [adminToken, setAdminToken] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCodes, setLoadingCodes] = useState(false)
  const [editingLink, setEditingLink] = useState<PurchaseLink | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingAccessCode, setEditingAccessCode] = useState<AccessCode | null>(null)
  const [showEditAccessCodeDialog, setShowEditAccessCodeDialog] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [codesError, setCodesError] = useState("")
  const [debugInfo, setDebugInfo] = useState("")

  const [newCode, setNewCode] = useState({
    type: "promotional" as "purchase" | "promotional" | "manual",
    maxUses: 3,
    expiresInDays: "",
    notes: "",
    customerName: "",
    customerEmail: "",
  })

  // Update the newLink state to include Stripe price ID
  const [newLink, setNewLink] = useState({
    name: "The Infinite Bloom",
    price: 19.99,
    description: "Experience a transformative journey through poetry",
    hasExpiration: false,
    expirationDate: "",
    stripeEnabled: true,
    paypalEnabled: true,
    wiseEnabled: true,
    stripePriceId: "",
    paypalLink: "",
    wiseLink: "",
    previewEnabled: true,
    previewPages: [9, 10, 11, 12],
  })

  const [newFreeLink, setNewFreeLink] = useState({
    name: "Free Preview Access",
    description: "Complimentary access to The Infinite Bloom",
    hasExpiration: false,
    expirationDate: "",
    previewPages: [1, 2, 3, 4, 5],
  })

  // Update the demo data to include Stripe price IDs
  const [purchaseLinks, setPurchaseLinks] = useState<PurchaseLink[]>([
    {
      id: "main",
      name: "The Infinite Bloom - Standard",
      slug: "the-infinite-bloom",
      price: 19.99,
      currency: "USD",
      description: "Experience a transformative journey through poetry",
      createdAt: new Date().toISOString(),
      clicks: 127,
      purchases: 23,
      revenue: 459.77,
      active: true,
      isDefault: true,
      hasExpiration: false,
      stripeEnabled: true,
      paypalEnabled: true,
      wiseEnabled: true,
      stripePriceId: "price_1234567890",
      paypalLink: "https://paypal.me/demo-main-product",
      wiseLink: "https://wise.com/pay/demo-main-product",
      previewEnabled: true,
      previewPages: [9, 10, 11, 12],
    },
    {
      id: "holiday",
      name: "Holiday Special - 25% Off",
      slug: "holiday-special",
      price: 14.99,
      currency: "USD",
      description: "Limited time holiday offer - Experience transformative poetry at a special price",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      hasExpiration: true,
      clicks: 89,
      purchases: 12,
      revenue: 179.88,
      active: true,
      isDefault: false,
      stripeEnabled: true,
      paypalEnabled: true,
      wiseEnabled: false,
      stripePriceId: "price_0987654321",
      paypalLink: "https://paypal.me/demo-holiday-special",
      previewEnabled: true,
      previewPages: [1, 2, 9, 10],
    },
  ])

  // Demo system failures data
  const [systemFailures] = useState<SystemFailure[]>([
    {
      id: "1",
      type: "webhook",
      description: "Failed to process Stripe webhook",
      errorMessage: "Database connection timeout",
      retryCount: 3,
      resolved: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sessionId: "cs_test_123456789",
    },
    {
      id: "2",
      type: "email",
      description: "Failed to send access code email",
      errorMessage: "SMTP server unavailable",
      retryCount: 2,
      resolved: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      customerEmail: "customer@example.com",
    },
    {
      id: "3",
      type: "webhook",
      description: "Webhook signature verification failed",
      errorMessage: "Invalid webhook signature",
      retryCount: 1,
      resolved: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sessionId: "cs_test_987654321",
    },
  ])

  useEffect(() => {
    setMounted(true)
    // Check if already authenticated
    const savedAuth = localStorage.getItem("adminAuthenticated")
    const savedToken = localStorage.getItem("adminToken")
    if (savedAuth === "true" && savedToken) {
      setIsAuthenticated(true)
      setAdminToken(savedToken)
      // Load access codes when authenticated
      loadAccessCodes(savedToken)
    }
  }, [])

  const loadAccessCodes = async (token: string) => {
    setLoadingCodes(true)
    setCodesError("")
    setDebugInfo("")

    try {
      console.log("Loading access codes with token:", token ? "***provided***" : "missing")

      const response = await fetch("/api/admin/list-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken: token }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok && data.success) {
        setAccessCodes(data.codes || [])
        if (data.warning) {
          setDebugInfo(data.warning)
        }
      } else {
        console.error("Failed to load access codes:", data.error)
        setCodesError(data.error || "Failed to load access codes")
        setDebugInfo(`Status: ${response.status}, Error: ${data.error}`)

        // Set demo data as fallback
        setAccessCodes([
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
        ])
      }
    } catch (error) {
      console.error("Error loading access codes:", error)
      setCodesError("Network error - using demo data")
      setDebugInfo(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)

      // Set demo data on error
      setAccessCodes([
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
      ])
    } finally {
      setLoadingCodes(false)
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleLogin = () => {
    setLoginError("")

    if (!adminToken.trim()) {
      setLoginError("Please enter an admin token")
      return
    }

    // For demo purposes, we'll accept any non-empty token
    // In production, this would validate against the environment variable
    setIsAuthenticated(true)
    localStorage.setItem("adminAuthenticated", "true")
    localStorage.setItem("adminToken", adminToken)
    setLoginError("")

    // Load access codes after login
    loadAccessCodes(adminToken)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuthenticated")
    localStorage.removeItem("adminToken")
    setAdminToken("")
    setAccessCodes([])
    setCodesError("")
    setDebugInfo("")
  }

  const createCode = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/create-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken,
          type: newCode.type,
          maxUses: newCode.maxUses,
          expiresInDays: newCode.expiresInDays ? Number.parseInt(newCode.expiresInDays) : undefined,
          notes: newCode.notes,
          customerName: newCode.customerName || undefined,
          customerEmail: newCode.customerEmail || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`New access code created: ${data.accessCode.code}`)
        // Reload access codes
        loadAccessCodes(adminToken)
      } else {
        throw new Error(data.error)
      }

      setNewCode({
        type: "promotional",
        maxUses: 3,
        expiresInDays: "",
        notes: "",
        customerName: "",
        customerEmail: "",
      })
    } catch (error) {
      alert("Failed to create access code")
    } finally {
      setLoading(false)
    }
  }

  // Update the createLink function to include Stripe price ID
  const createLink = () => {
    if (newLink.price <= 0) {
      alert("Please enter a valid price greater than $0")
      return
    }

    const linkId = Math.random().toString(36).substring(2, 10).toLowerCase()
    const slug = generateSlug(newLink.name)

    const newPurchaseLink: PurchaseLink = {
      id: linkId,
      name: newLink.name,
      slug: slug,
      price: newLink.price,
      currency: "USD",
      description: newLink.description,
      createdAt: new Date().toISOString(),
      expiresAt:
        newLink.hasExpiration && newLink.expirationDate ? new Date(newLink.expirationDate).toISOString() : undefined,
      hasExpiration: newLink.hasExpiration,
      clicks: 0,
      purchases: 0,
      revenue: 0,
      active: true,
      isDefault: false,
      stripeEnabled: true,
      paypalEnabled: true,
      wiseEnabled: true,
      stripePriceId: "",
      paypalLink: "",
      wiseLink: "",
      previewEnabled: true,
      previewPages: [9, 10, 11, 12],
    }

    setPurchaseLinks((prev) => [...prev, newPurchaseLink])

    const shareUrl = `${window.location.origin}/pwa/buy/${slug}`
    alert(`Purchase link created!\nURL: ${shareUrl}`)

    // Reset form
    setNewLink({
      name: "The Infinite Bloom",
      price: 19.99,
      description: "Experience a transformative journey through poetry",
      hasExpiration: false,
      expirationDate: "",
      stripeEnabled: true,
      paypalEnabled: true,
      wiseEnabled: true,
      stripePriceId: "",
      paypalLink: "",
      wiseLink: "",
      previewEnabled: true,
      previewPages: [9, 10, 11, 12],
    })
  }

  const createFreeLink = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/create-free-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken,
          name: newFreeLink.name,
          description: newFreeLink.description,
          expiresInDays:
            newFreeLink.hasExpiration && newFreeLink.expirationDate
              ? Math.ceil((new Date(newFreeLink.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : undefined,
          previewPages: newFreeLink.previewPages,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Add to local state
        const newLink: PurchaseLink = {
          id: data.link.id,
          name: data.link.name,
          slug: data.link.slug,
          price: 0.0,
          currency: "USD",
          description: data.link.description,
          createdAt: data.link.createdAt,
          expiresAt: data.link.expiresAt,
          hasExpiration: data.link.hasExpiration,
          clicks: 0,
          purchases: 0,
          revenue: 0,
          active: true,
          isDefault: false,
          stripeEnabled: false,
          paypalEnabled: false,
          wiseEnabled: false,
          stripePriceId: undefined,
          paypalLink: undefined,
          wiseLink: undefined,
          previewEnabled: true,
          previewPages: data.link.previewPages,
        }

        setPurchaseLinks((prev) => [...prev, newLink])
        alert(`Free access link created!\nURL: ${data.shareUrl}`)
      } else {
        throw new Error(data.error)
      }

      // Reset form
      setNewFreeLink({
        name: "Free Preview Access",
        description: "Complimentary access to The Infinite Bloom",
        hasExpiration: false,
        expirationDate: "",
        previewPages: [1, 2, 3, 4, 5],
      })
    } catch (error) {
      alert("Failed to create free access link")
    } finally {
      setLoading(false)
    }
  }

  // Update the editLink function to handle Stripe price ID
  const editLink = (link: PurchaseLink) => {
    setEditingLink({
      ...link,
      expirationDate: link.expiresAt ? new Date(link.expiresAt).toISOString().split("T")[0] : "",
      stripePriceId: link.stripePriceId || "",
      paypalLink: link.paypalLink || "",
      wiseLink: link.wiseLink || "",
    })
    setShowEditDialog(true)
  }

  const saveEditedLink = () => {
    if (!editingLink) return

    const updatedLink: PurchaseLink = {
      ...editingLink,
      slug: generateSlug(editingLink.name),
      expiresAt:
        editingLink.hasExpiration && editingLink.expirationDate
          ? new Date(editingLink.expirationDate).toISOString()
          : undefined,
    }

    setPurchaseLinks((prev) => prev.map((link) => (link.id === editingLink.id ? updatedLink : link)))

    setShowEditDialog(false)
    setEditingLink(null)
    alert("Purchase link updated successfully!")
  }

  const deleteLink = (linkId: string) => {
    const link = purchaseLinks.find((l) => l.id === linkId)
    if (!link) return

    if (link.isDefault) {
      alert("Cannot delete the default purchase link. Set another link as default first.")
      return
    }

    if (confirm(`Are you sure you want to delete "${link.name}"? This action cannot be undone.`)) {
      setPurchaseLinks((prev) => prev.filter((link) => link.id !== linkId))
      alert("Purchase link deleted successfully!")
    }
  }

  const setAsDefault = (linkId: string) => {
    setPurchaseLinks((prev) =>
      prev.map((link) => ({
        ...link,
        isDefault: link.id === linkId,
      })),
    )
    alert("Default purchase link updated!")
  }

  const toggleLinkActive = (linkId: string, active: boolean) => {
    setPurchaseLinks((prev) =>
      prev.map((link) => ({
        ...link,
        active: link.id === linkId ? active : link.active,
      })),
    )
    alert(`Purchase link ${active ? "activated" : "deactivated"} successfully!`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  const generateQRCode = (url: string) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    const newWindow = window.open("", "_blank", "width=400,height=400")
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>QR Code</title></head>
          <body style="margin:0;padding:20px;text-align:center;font-family:Arial,sans-serif;">
            <h3>QR Code for Purchase Link</h3>
            <img src="${qrUrl}" alt="QR Code" style="max-width:100%;" />
            <p style="font-size:12px;color:#666;margin-top:20px;">Scan to access purchase page</p>
          </body>
        </html>
      `)
    }
  }

  const refreshAccessCodes = () => {
    loadAccessCodes(adminToken)
  }

  const editAccessCode = (code: AccessCode) => {
    setEditingAccessCode({
      ...code,
      expiresAt: code.expiresAt ? new Date(code.expiresAt).toISOString().split("T")[0] : "", // Format for date input
    })
    setShowEditAccessCodeDialog(true)
  }

  const saveEditedAccessCode = async () => {
    if (!editingAccessCode) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/update-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken,
          codeId: editingAccessCode.id,
          updates: {
            max_uses: editingAccessCode.maxUses,
            active: editingAccessCode.active,
            expires_at: editingAccessCode.expiresAt ? new Date(editingAccessCode.expiresAt).toISOString() : null,
            notes: editingAccessCode.notes,
            customer_name: editingAccessCode.customerName,
            customer_email: editingAccessCode.customerEmail,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Access code updated successfully!")
        loadAccessCodes(adminToken) // Reload to reflect changes
        setShowEditAccessCodeDialog(false)
        setEditingAccessCode(null)
      } else {
        throw new Error(data.error || "Failed to update access code")
      }
    } catch (error) {
      console.error("Error saving edited access code:", error)
      alert(`Failed to update access code: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteAccessCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this access code? This action cannot be undone.")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/delete-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminToken, codeId }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Access code deleted successfully!")
        loadAccessCodes(adminToken) // Reload to reflect changes
      } else {
        throw new Error(data.error || "Failed to delete access code")
      }
    } catch (error) {
      console.error("Error deleting access code:", error)
      alert(`Failed to delete access code: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Enter your admin token to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminToken">Admin Token</Label>
              <div className="relative">
                <Input
                  id="adminToken"
                  type={showToken ? "text" : "password"}
                  placeholder="Enter admin token"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <Button onClick={handleLogin} className="w-full" disabled={!adminToken.trim()}>
              Login
            </Button>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                For demo: any non-empty token works
                <br />
                Production: Set ADMIN_TOKEN in environment
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">The Infinite Bloom - Management Console</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="links">Purchase Links</TabsTrigger>
            <TabsTrigger value="codes">Access Codes</TabsTrigger>
            <TabsTrigger value="system">System Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MousePointer className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {purchaseLinks.reduce((sum, link) => sum + link.clicks, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {purchaseLinks.reduce((sum, link) => sum + link.purchases, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${purchaseLinks.reduce((sum, link) => sum + link.revenue, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {purchaseLinks.reduce((sum, link) => sum + link.clicks, 0) > 0
                          ? (
                              (purchaseLinks.reduce((sum, link) => sum + link.purchases, 0) /
                                purchaseLinks.reduce((sum, link) => sum + link.clicks, 0)) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Links</CardTitle>
                  <CardDescription>Purchase links ranked by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {purchaseLinks
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((link) => (
                        <div key={link.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <div>
                              <p className="font-medium">{link.name}</p>
                              <p className="text-sm text-gray-500">
                                {link.purchases} purchases • {link.clicks} clicks
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${link.revenue.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">
                              {link.clicks > 0 ? ((link.purchases / link.clicks) * 100).toFixed(1) : "0.0"}% conv.
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest purchase link activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {purchaseLinks
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((link) => (
                        <div key={link.id} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <div className="flex-1">
                            <p className="font-medium">{link.name}</p>
                            <p className="text-sm text-gray-500">
                              Created {new Date(link.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={link.active ? "default" : "secondary"}>
                            {link.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create Purchase Link</span>
                  </CardTitle>
                  <CardDescription>Create a new paid purchase link with Stripe integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkName">Link Name</Label>
                    <Input
                      id="linkName"
                      placeholder="e.g., Holiday Special"
                      value={newLink.name}
                      onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkPrice">Price (USD)</Label>
                    <Input
                      id="linkPrice"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="19.99"
                      value={newLink.price}
                      onChange={(e) => setNewLink({ ...newLink, price: Number.parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkDescription">Description</Label>
                    <Textarea
                      id="linkDescription"
                      placeholder="Describe what customers will get..."
                      value={newLink.description}
                      onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Payment Methods</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newLink.stripeEnabled}
                            onCheckedChange={(checked) => setNewLink({ ...newLink, stripeEnabled: checked })}
                          />
                          <Label>Stripe (Credit Cards)</Label>
                        </div>
                      </div>
                      {newLink.stripeEnabled && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="stripePriceId">Stripe Price ID</Label>
                          <Input
                            id="stripePriceId"
                            placeholder="price_1234567890"
                            value={newLink.stripePriceId}
                            onChange={(e) => setNewLink({ ...newLink, stripePriceId: e.target.value })}
                          />
                          <p className="text-xs text-gray-500">
                            Create this in your Stripe Dashboard first, then paste the Price ID here
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newLink.paypalEnabled}
                            onCheckedChange={(checked) => setNewLink({ ...newLink, paypalEnabled: checked })}
                          />
                          <Label>PayPal</Label>
                        </div>
                      </div>
                      {newLink.paypalEnabled && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="paypalLink">PayPal Link</Label>
                          <Input
                            id="paypalLink"
                            placeholder="https://paypal.me/yourlink"
                            value={newLink.paypalLink}
                            onChange={(e) => setNewLink({ ...newLink, paypalLink: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newLink.wiseEnabled}
                            onCheckedChange={(checked) => setNewLink({ ...newLink, wiseEnabled: checked })}
                          />
                          <Label>Wise Transfer</Label>
                        </div>
                      </div>
                      {newLink.wiseEnabled && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="wiseLink">Wise Payment Link</Label>
                          <Input
                            id="wiseLink"
                            placeholder="https://wise.com/pay/yourlink"
                            value={newLink.wiseLink}
                            onChange={(e) => setNewLink({ ...newLink, wiseLink: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newLink.hasExpiration}
                      onCheckedChange={(checked) => setNewLink({ ...newLink, hasExpiration: checked })}
                    />
                    <Label>Set Expiration Date</Label>
                  </div>

                  {newLink.hasExpiration && (
                    <div className="space-y-2">
                      <Label htmlFor="expirationDate">Expiration Date</Label>
                      <Input
                        id="expirationDate"
                        type="date"
                        value={newLink.expirationDate}
                        onChange={(e) => setNewLink({ ...newLink, expirationDate: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newLink.previewEnabled}
                      onCheckedChange={(checked) => setNewLink({ ...newLink, previewEnabled: checked })}
                    />
                    <Label>Enable Preview</Label>
                  </div>

                  {newLink.previewEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="previewPages">Preview Pages (comma-separated)</Label>
                      <Input
                        id="previewPages"
                        placeholder="9, 10, 11, 12"
                        value={newLink.previewPages.join(", ")}
                        onChange={(e) =>
                          setNewLink({
                            ...newLink,
                            previewPages: e.target.value
                              .split(",")
                              .map((p) => Number.parseInt(p.trim()))
                              .filter((p) => !Number.isNaN(p)),
                          })
                        }
                      />
                    </div>
                  )}

                  <Button onClick={createLink} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Purchase Link
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gift className="w-5 h-5" />
                    <span>Create Free Access Link</span>
                  </CardTitle>
                  <CardDescription>Create a complimentary access link (no payment required)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="freeLinkName">Link Name</Label>
                    <Input
                      id="freeLinkName"
                      placeholder="e.g., Free Preview Access"
                      value={newFreeLink.name}
                      onChange={(e) => setNewFreeLink({ ...newFreeLink, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeLinkDescription">Description</Label>
                    <Textarea
                      id="freeLinkDescription"
                      placeholder="Describe what users will get with free access..."
                      value={newFreeLink.description}
                      onChange={(e) => setNewFreeLink({ ...newFreeLink, description: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newFreeLink.hasExpiration}
                      onCheckedChange={(checked) => setNewFreeLink({ ...newFreeLink, hasExpiration: checked })}
                    />
                    <Label>Set Expiration Date</Label>
                  </div>

                  {newFreeLink.hasExpiration && (
                    <div className="space-y-2">
                      <Label htmlFor="freeExpirationDate">Expiration Date</Label>
                      <Input
                        id="freeExpirationDate"
                        type="date"
                        value={newFreeLink.expirationDate}
                        onChange={(e) => setNewFreeLink({ ...newFreeLink, expirationDate: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="freePreviewPages">Available Pages (comma-separated)</Label>
                    <Input
                      id="freePreviewPages"
                      placeholder="1, 2, 3, 4, 5"
                      value={newFreeLink.previewPages.join(", ")}
                      onChange={(e) =>
                        setNewFreeLink({
                          ...newFreeLink,
                          previewPages: e.target.value
                            .split(",")
                            .map((p) => Number.parseInt(p.trim()))
                            .filter((p) => !Number.isNaN(p)),
                        })
                      }
                    />
                  </div>

                  <Button
                    onClick={createFreeLink}
                    disabled={loading}
                    className="w-full bg-transparent"
                    variant="outline"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Create Free Access Link
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Existing Purchase Links</CardTitle>
                <CardDescription>Manage your purchase links and view performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchaseLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{link.name}</h3>
                            {link.isDefault && <Badge variant="default">Default</Badge>}
                            <Badge variant={link.active ? "default" : "secondary"}>
                              {link.active ? "Active" : "Inactive"}
                            </Badge>
                            {link.hasExpiration && link.expiresAt && (
                              <Badge variant="outline">Expires {new Date(link.expiresAt).toLocaleDateString()}</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{link.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              ${link.price.toFixed(2)} {link.currency}
                            </span>
                            <span>{link.clicks} clicks</span>
                            <span>{link.purchases} purchases</span>
                            <span>${link.revenue.toFixed(2)} revenue</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/pwa/buy/${link.slug}`
                              window.open(url, "_blank")
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/pwa/buy/${link.slug}`
                              copyToClipboard(url)
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = `${window.location.origin}/pwa/buy/${link.slug}`
                              generateQRCode(url)
                            }}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => editLink(link)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!link.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteLink(link.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={link.active}
                            onCheckedChange={(checked) => toggleLinkActive(link.id, checked)}
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                        {!link.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => setAsDefault(link.id)}>
                            Set as Default
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="codes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create Access Code</span>
                  </CardTitle>
                  <CardDescription>Generate a new access code for manual distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codeType">Code Type</Label>
                    <select
                      id="codeType"
                      className="w-full p-2 border rounded-md"
                      value={newCode.type}
                      onChange={(e) =>
                        setNewCode({ ...newCode, type: e.target.value as "purchase" | "promotional" | "manual" })
                      }
                    >
                      <option value="promotional">Promotional</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxUses">Maximum Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      max="10"
                      value={newCode.maxUses}
                      onChange={(e) => setNewCode({ ...newCode, maxUses: Number.parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresInDays">Expires in Days (optional)</Label>
                    <Input
                      id="expiresInDays"
                      type="number"
                      min="1"
                      placeholder="Leave empty for no expiration"
                      value={newCode.expiresInDays}
                      onChange={(e) => setNewCode({ ...newCode, expiresInDays: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name (optional)</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={newCode.customerName}
                      onChange={(e) => setNewCode({ ...newCode, customerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Customer Email (optional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={newCode.customerEmail}
                      onChange={(e) => setNewCode({ ...newCode, customerEmail: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Internal notes about this code..."
                      value={newCode.notes}
                      onChange={(e) => setNewCode({ ...newCode, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={createCode} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Access Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Access Codes</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={refreshAccessCodes} disabled={loadingCodes}>
                      {loadingCodes ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                  <CardDescription>View and manage all generated access codes</CardDescription>
                </CardHeader>
                <CardContent>
                  {(codesError || debugInfo) && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <div className="text-sm">
                          {codesError && <p className="text-yellow-800 font-medium">{codesError}</p>}
                          {debugInfo && <p className="text-yellow-600 text-xs mt-1">{debugInfo}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {loadingCodes ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500">Loading access codes...</p>
                    </div>
                  ) : accessCodes.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {accessCodes.map((code) => (
                        <div key={code.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-bold">
                                {code.code}
                              </code>
                              <Badge variant={code.type === "purchase" ? "default" : "secondary"}>{code.type}</Badge>
                              <Badge variant={code.active ? "default" : "destructive"}>
                                {code.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => copyToClipboard(code.code)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => editAccessCode(code)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAccessCode(code.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {code.customerName && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <Users className="w-3 h-3" />
                              <span>{code.customerName}</span>
                              {code.customerEmail && <span>({code.customerEmail})</span>}
                            </div>
                          )}

                          {code.paymentProcessor && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <CreditCard className="w-3 h-3" />
                              <span>{code.paymentProcessor}</span>
                              {code.transactionId && <span>({code.transactionId})</span>}
                            </div>
                          )}

                          {code.amountPaid && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <DollarSign className="w-3 h-3" />
                              <span>
                                {code.amountPaid.toFixed(2)} {code.currency}
                              </span>
                              {code.paymentDate && <span>({new Date(code.paymentDate).toLocaleDateString()})</span>}
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                            <Users className="w-3 h-3" />
                            <span>
                              Uses: {code.currentUses} / {code.maxUses}
                            </span>
                            <span>Devices: {code.devices}</span>
                          </div>

                          {code.expiresAt && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <Calendar className="w-3 h-3" />
                              <span>Expires: {new Date(code.expiresAt).toLocaleDateString()}</span>
                            </div>
                          )}

                          {code.notes && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <FileText className="w-3 h-3" />
                              <span>Notes: {code.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No access codes found.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>System Failures</span>
                </CardTitle>
                <CardDescription>Review and manage system errors and retries</CardDescription>
              </CardHeader>
              <CardContent>
                {systemFailures.length > 0 ? (
                  <div className="space-y-4">
                    {systemFailures.map((failure) => (
                      <div key={failure.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{failure.description}</h3>
                              <Badge variant={failure.resolved ? "default" : "destructive"}>
                                {failure.resolved ? "Resolved" : "Unresolved"}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">
                              Error: <span className="font-mono text-xs">{failure.errorMessage}</span>
                            </p>
                            <div className="text-sm text-gray-500">
                              <p>Type: {failure.type}</p>
                              <p>Retries: {failure.retryCount}</p>
                              <p>Occurred: {new Date(failure.createdAt).toLocaleString()}</p>
                              {failure.customerEmail && <p>Customer: {failure.customerEmail}</p>}
                              {failure.sessionId && <p>Session ID: {failure.sessionId}</p>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" disabled={failure.resolved}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No system failures to report.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showEditDialog && editingLink && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Purchase Link</DialogTitle>
              <DialogDescription>
                Make changes to the purchase link here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editLinkName">Link Name</Label>
                <Input
                  id="editLinkName"
                  value={editingLink.name}
                  onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLinkPrice">Price (USD)</Label>
                <Input
                  id="editLinkPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editingLink.price}
                  onChange={(e) => setEditingLink({ ...editingLink, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLinkDescription">Description</Label>
                <Textarea
                  id="editLinkDescription"
                  value={editingLink.description}
                  onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <Label>Payment Methods</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingLink.stripeEnabled}
                        onCheckedChange={(checked) => setEditingLink({ ...editingLink, stripeEnabled: checked })}
                      />
                      <Label>Stripe (Credit Cards)</Label>
                    </div>
                  </div>
                  {editingLink.stripeEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="editStripePriceId">Stripe Price ID</Label>
                      <Input
                        id="editStripePriceId"
                        placeholder="price_1234567890"
                        value={editingLink.stripePriceId}
                        onChange={(e) => setEditingLink({ ...editingLink, stripePriceId: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingLink.paypalEnabled}
                        onCheckedChange={(checked) => setEditingLink({ ...editingLink, paypalEnabled: checked })}
                      />
                      <Label>PayPal</Label>
                    </div>
                  </div>
                  {editingLink.paypalEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="editPaypalLink">PayPal Link</Label>
                      <Input
                        id="editPaypalLink"
                        placeholder="https://paypal.me/yourlink"
                        value={editingLink.paypalLink}
                        onChange={(e) => setEditingLink({ ...editingLink, paypalLink: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingLink.wiseEnabled}
                        onCheckedChange={(checked) => setEditingLink({ ...editingLink, wiseEnabled: checked })}
                      />
                      <Label>Wise Transfer</Label>
                    </div>
                  </div>
                  {editingLink.wiseEnabled && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="editWiseLink">Wise Payment Link</Label>
                      <Input
                        id="editWiseLink"
                        placeholder="https://wise.com/pay/yourlink"
                        value={editingLink.wiseLink}
                        onChange={(e) => setEditingLink({ ...editingLink, wiseLink: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingLink.hasExpiration}
                  onCheckedChange={(checked) => setEditingLink({ ...editingLink, hasExpiration: checked })}
                />
                <Label>Set Expiration Date</Label>
              </div>
              {editingLink.hasExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="editExpirationDate">Expiration Date</Label>
                  <Input
                    id="editExpirationDate"
                    type="date"
                    value={editingLink.expirationDate}
                    onChange={(e) => setEditingLink({ ...editingLink, expirationDate: e.target.value })}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingLink.previewEnabled}
                  onCheckedChange={(checked) => setEditingLink({ ...editingLink, previewEnabled: checked })}
                />
                <Label>Enable Preview</Label>
              </div>
              {editingLink.previewEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="editPreviewPages">Preview Pages (comma-separated)</Label>
                  <Input
                    id="editPreviewPages"
                    placeholder="9, 10, 11, 12"
                    value={editingLink.previewPages.join(", ")}
                    onChange={(e) =>
                      setEditingLink({
                        ...editingLink,
                        previewPages: e.target.value
                          .split(",")
                          .map((p) => Number.parseInt(p.trim()))
                          .filter((p) => !Number.isNaN(p)),
                      })
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={saveEditedLink}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showEditAccessCodeDialog && editingAccessCode && (
        <Dialog open={showEditAccessCodeDialog} onOpenChange={setShowEditAccessCodeDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Access Code</DialogTitle>
              <DialogDescription>Make changes to the access code here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCode">Code</Label>
                <Input id="editCode" value={editingAccessCode.code} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaxUses">Maximum Uses</Label>
                <Input
                  id="editMaxUses"
                  type="number"
                  min="1"
                  max="10"
                  value={editingAccessCode.maxUses}
                  onChange={(e) =>
                    setEditingAccessCode({ ...editingAccessCode, maxUses: Number.parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingAccessCode.active}
                  onCheckedChange={(checked) => setEditingAccessCode({ ...editingAccessCode, active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editExpiresAt">Expiration Date (optional)</Label>
                <Input
                  id="editExpiresAt"
                  type="date"
                  value={editingAccessCode.expiresAt || ""}
                  onChange={(e) => setEditingAccessCode({ ...editingAccessCode, expiresAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCustomerName">Customer Name (optional)</Label>
                <Input
                  id="editCustomerName"
                  placeholder="John Doe"
                  value={editingAccessCode.customerName || ""}
                  onChange={(e) => setEditingAccessCode({ ...editingAccessCode, customerName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCustomerEmail">Customer Email (optional)</Label>
                <Input
                  id="editCustomerEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={editingAccessCode.customerEmail || ""}
                  onChange={(e) => setEditingAccessCode({ ...editingAccessCode, customerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">Notes (optional)</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Internal notes about this code..."
                  value={editingAccessCode.notes || ""}
                  onChange={(e) => setEditingAccessCode({ ...editingAccessCode, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveEditedAccessCode} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
