"use client"

import { useEffect, useRef, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function PreviewViewer() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handleIframeLoad = () => {
      setIframeLoaded(true)
      toast({
        title: "Flipbook Loaded",
        description: "The Infinite Bloom flipbook is ready.",
      })
    }

    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad)
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad)
      }
    }
  }, [toast])

  return (
    <div className="flipbook-iframe-container">
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-600">
          Loading Flipbook...
        </div>
      )}
      <iframe
        ref={iframeRef}
        src="/flipbook-viewer.html" // Path to your HTML file in the public directory
        title="Infinite Bloom Flipbook"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  )
}
