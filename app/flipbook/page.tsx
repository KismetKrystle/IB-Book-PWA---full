"use client"

import { useEffect, useState } from "react"

export default function FlipbookPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading flipbook...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-gray-100">
      <iframe
        src="/my-flipbook-content/index.html" // Ensure this path matches your folder name in public/
        title="Flipbook Viewer"
        className="w-full h-full border-none"
        allowFullScreen
      ></iframe>
    </div>
  )
}
