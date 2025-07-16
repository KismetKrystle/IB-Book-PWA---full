"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Mail,
  Smartphone,
  HardDrive,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  LogOut,
  Shield,
  Clock,
  Database,
  Moon,
  Sun,
  Settings,
} from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserData {
  email: string
  registeredAt: string
  lastAccess: string
  deviceCount: number
  theme: "light" | "dark"
}

interface StorageInfo {
  cacheSize: string
  offlineStatus: boolean
  lastSync: string
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [darkMode, setDarkMode] = useState(false) // Example setting

  useEffect(() => {
    if (isOpen) {
      loadUserData()
      loadStorageInfo()
      loadTheme()
    }
  }, [isOpen])

  const loadUserData = () => {
    const email = localStorage.getItem("infiniteBloomEmail")
    const authExpiry = localStorage.getItem("infiniteBloomAuthExpiry")
    const lastAccess = localStorage.getItem("infiniteBloomLastAccess")
    const token = localStorage.getItem("infiniteBloomToken")

    if (email && token) {
      // Calculate registration date (approximate from auth expiry - 30 days)
      const expiryDate = new Date(authExpiry || Date.now())
      const registeredAt = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000)

      setUserData({
        email,
        registeredAt: registeredAt.toISOString(),
        lastAccess: lastAccess || new Date().toISOString(),
        deviceCount: 1, // Current device (in production, this would come from database)
        theme: theme,
      })
    }
  }

  const loadStorageInfo = () => {
    // Calculate approximate cache size
    let totalSize = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }

    // Check if service worker is active
    const offlineStatus = "serviceWorker" in navigator && localStorage.getItem("offlineCacheEnabled") === "true"

    setStorageInfo({
      cacheSize: `${Math.round(totalSize / 1024)} KB`,
      offlineStatus,
      lastSync: new Date().toISOString(),
    })
  }

  const loadTheme = () => {
    const savedTheme = (localStorage.getItem("infiniteBloomTheme") as "light" | "dark") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }

  const applyTheme = (newTheme: "light" | "dark") => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
    localStorage.setItem("infiniteBloomTheme", newTheme)
    applyTheme(newTheme)
    setMessage("Theme updated successfully!")
    setTimeout(() => setMessage(""), 3000)
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill in all password fields")
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords don't match")
      return
    }

    if (newPassword.length < 6) {
      setMessage("New password must be at least 6 characters")
      return
    }

    const storedPassword = localStorage.getItem("infiniteBloomPassword")
    if (currentPassword !== storedPassword) {
      setMessage("Current password is incorrect")
      return
    }

    setLoading(true)
    try {
      // Update password
      localStorage.setItem("infiniteBloomPassword", newPassword)

      // Clear form
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setMessage("Password updated successfully!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Failed to update password")
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = () => {
    if (confirm("This will clear all cached content and you may need to re-download the book. Continue?")) {
      // Clear specific cache items but keep authentication
      const keysToKeep = [
        "infiniteBloomToken",
        "infiniteBloomEmail",
        "infiniteBloomPassword",
        "infiniteBloomAuthExpiry",
        "infiniteBloomTheme",
      ]

      const itemsToKeep: { [key: string]: string } = {}
      keysToKeep.forEach((key) => {
        const value = localStorage.getItem(key)
        if (value) itemsToKeep[key] = value
      })

      localStorage.clear()

      // Restore authentication data
      Object.entries(itemsToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value)
      })

      setMessage("Cache cleared successfully!")
      loadStorageInfo()
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleRefreshContent = () => {
    setLoading(true)
    // Simulate content refresh
    setTimeout(() => {
      localStorage.setItem("infiniteBloomLastSync", new Date().toISOString())
      loadStorageInfo()
      setLoading(false)
      setMessage("Content refreshed successfully!")
      setTimeout(() => setMessage(""), 3000)
    }, 2000)
  }

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out? You'll need your access code to sign back in.")) {
      localStorage.clear()
      window.location.href = "/pwa"
    }
  }

  const handleSignOutAllDevices = () => {
    if (
      confirm(
        "This will sign you out from all devices. You'll need your access code to sign back in on any device. Continue?",
      )
    ) {
      // In production, this would invalidate the session on the server
      localStorage.clear()
      setMessage("Signed out from all devices")
      setTimeout(() => {
        window.location.href = "/pwa"
      }, 2000)
    }
  }

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    // Implement actual dark mode toggle logic here (e.g., add/remove class from <html>)
    document.documentElement.classList.toggle("dark", checked)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Manage your account, preferences, and app data</DialogDescription>
        </DialogHeader>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">
            {message}
          </div>
        )}

        <Tabs defaultValue="account" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-1">
              <Palette className="w-4 h-4" />
              Display
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-1">
              <HardDrive className="w-4 h-4" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-1">
              <Smartphone className="w-4 h-4" />
              Devices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono">
                        {userData?.email}
                      </Badge>
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Member Since</Label>
                    <p className="text-sm mt-1">
                      {userData?.registeredAt ? new Date(userData.registeredAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Access</Label>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {userData?.lastAccess ? new Date(userData.lastAccess).toLocaleString() : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={loading} className="w-full">
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how the app looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                      className="flex items-center gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                      className="flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Dark Mode</Label>
                  <div className="flex gap-3">
                    <Switch id="darkMode" checked={darkMode} onCheckedChange={handleDarkModeChange} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Reading Preferences</Label>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Font size and reading preferences are controlled within the flipbook reader</p>
                    <p>• Audio playback settings are available in the book interface</p>
                    <p>• Page navigation preferences can be adjusted while reading</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Storage & Cache
                </CardTitle>
                <CardDescription>Manage your offline content and app data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Cache Size</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{storageInfo?.cacheSize || "0 KB"}</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Offline Status</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={storageInfo?.offlineStatus ? "default" : "secondary"}>
                        {storageInfo?.offlineStatus ? "Available" : "Limited"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Last Sync</Label>
                  <p className="text-sm">
                    {storageInfo?.lastSync ? new Date(storageInfo.lastSync).toLocaleString() : "Never"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRefreshContent}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh Content
                    </Button>
                    <Button
                      onClick={handleClearCache}
                      variant="outline"
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-700 bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cache
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Refreshing content will update your offline book data. Clearing cache will free up space but may
                    require re-downloading content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Device Management
                </CardTitle>
                <CardDescription>Manage devices connected to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">This Device</p>
                        <p className="text-sm text-gray-500">
                          {navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"} • Active now
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Current</Badge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Your access code works on up to 3 devices</p>
                    <p>• Currently using 1 of 3 device slots</p>
                    <p>• Devices are automatically registered when you sign in</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Security Actions</Label>
                  <div className="space-y-2">
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full flex items-center gap-2 text-orange-600 hover:text-orange-700 bg-transparent"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out This Device
                    </Button>
                    <Button
                      onClick={handleSignOutAllDevices}
                      variant="outline"
                      className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 bg-transparent"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out All Devices
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    You'll need your access code to sign back in after signing out.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
