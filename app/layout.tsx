import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Infinite Bloom - Digital Poetry Book",
  description: "Evolving by Perspective - Listen & Read 45 Poems by Kismet Krystle",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Infinite Bloom",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "The Infinite Bloom",
    title: "The Infinite Bloom - Digital Poetry Book",
    description: "Evolving by Perspective - Listen & Read 45 Poems",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#6B73FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
