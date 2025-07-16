"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthCheckProps {
  children: React.ReactNode
  redirectPath?: string
}

export function AuthCheck({ children, redirectPath = "/pwa" }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const sessionToken = localStorage.getItem("sessionToken")
    if (sessionToken) {
      // In a real application, you would validate this token with your backend
      // For this demo, we'll assume any token means authenticated.
      setIsAuthenticated(true)
    } else {
      router.push(redirectPath)
    }
    setLoading(false)
  }, [router, redirectPath])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Or a small loading spinner, as redirect is happening
  }

  return <>{children}</>
}
