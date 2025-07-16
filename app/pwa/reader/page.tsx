"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsModal } from "@/components/settings-modal"
import { PreviewViewer } from "@/components/preview-viewer"
import { useToast } from "@/components/ui/use-toast"

export default function ReaderPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const sessionToken = localStorage.getItem("sessionToken")
    if (sessionToken) {
      // In a real application, you would validate this token with your backend
      // For this demo, we'll assume any token means authenticated.
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("sessionToken")
    localStorage.removeItem("deviceFingerprint") // Clear device fingerprint on logout
    setIsAuthenticated(false)
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
    router.push("/pwa")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading reader...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Access Denied</CardTitle>
            <CardDescription className="mt-2 text-lg text-red-600">
              You need a valid access code to view the flipbook.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Button onClick={() => router.push("/pwa")} className="w-full py-3 text-lg">
              Enter Access Code
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Infinite Bloom Reader</h1>
        <div className="flex items-center space-x-2">
          <SettingsModal />
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="h-full w-full max-w-4xl rounded-lg bg-white shadow-lg">
          {/* The iframe will load the flipbook content from the public directory */}
          <PreviewViewer />
        </div>
      </main>
    </div>
  )
}
