"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function FlipbookPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const iframe = document.getElementById("flipbook-iframe") as HTMLIFrameElement
    if (iframe) {
      iframe.onload = () => {
        setLoading(false)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
          <p className="ml-3 text-gray-500">Loading Flipbook...</p>
        </div>
      )}
      <iframe
        id="flipbook-iframe"
        src="/my-flipbook-content/index.html" // Ensure this path matches your folder name in public/
        className="w-full h-full border-0"
        title="Flipbook Viewer"
        allowFullScreen
      ></iframe>
    </div>
  )
}
