"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, User } from "lucide-react"
import { SettingsModal } from "@/components/settings-modal"

export default function FlipbookPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Check authentication and update last access
    const checkAuth = () => {
      const token = localStorage.getItem("infiniteBloomToken")
      const email = localStorage.getItem("infiniteBloomEmail")
      const password = localStorage.getItem("infiniteBloomPassword")
      const authExpiry = localStorage.getItem("infiniteBloomAuthExpiry")

      if (token && email && password && authExpiry) {
        const expiryDate = new Date(authExpiry)
        if (expiryDate > new Date()) {
          setIsAuthenticated(true)
          setUserEmail(email)
          // Update last access time
          const now = new Date().toISOString()
          localStorage.setItem("infiniteBloomLastAccess", now)
        } else {
          // Auth expired, redirect to login
          localStorage.clear()
          window.location.href = "/"
        }
      } else {
        window.location.href = "/"
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out? You'll need your access code to sign back in.")) {
      localStorage.clear()
      window.location.href = "/"
    }
  }

  const handleSettings = () => {
    setShowSettings(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">Loading your book...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">The Infinite Bloom</h1>
                <p className="text-sm text-gray-500">Evolving by Perspective • Offline Reader</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{userEmail}</span>
                <span className="sm:hidden">Signed In</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flipbook Container */}
      <div className="w-full h-[calc(100vh-80px)]">
        <iframe
          src="/flipbook-viewer.html"
          className="w-full h-full border-0"
          title="The Infinite Bloom - Digital Poetry Book"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}
