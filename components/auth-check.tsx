"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthCheckProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthCheck({ children, redirectTo = "/" }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("infiniteBloomToken")
      const password = localStorage.getItem("infiniteBloomPassword")
      const authExpiry = localStorage.getItem("infiniteBloomAuthExpiry")

      if (token && password && authExpiry) {
        const expiryDate = new Date(authExpiry)
        if (expiryDate > new Date()) {
          setIsAuthenticated(true)
          setLoading(false)
          return
        }
      }

      // Not authenticated or expired
      localStorage.clear()
      router.push(redirectTo)
    }

    checkAuth()
  }, [router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}
