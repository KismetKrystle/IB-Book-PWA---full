"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface PreviewViewerProps {
  previewPages?: number[]
  onPurchaseClick?: () => void
  purchaseUrl?: string
}

export function PreviewViewer({ previewPages = [9, 10, 11, 12], onPurchaseClick, purchaseUrl }: PreviewViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Initialize the flipbook viewer with limited pages
    if (iframeRef.current) {
      const iframe = iframeRef.current
      iframe.onload = () => {
        try {
          // Send preview configuration to the flipbook viewer
          iframe.contentWindow?.postMessage(
            {
              type: "PREVIEW_MODE",
              pages: previewPages,
              isPreview: true,
            },
            "*",
          )
        } catch (error) {
          console.log("Preview configuration sent")
        }
      }
    }
  }, [previewPages])

  const handlePurchase = () => {
    if (onPurchaseClick) {
      onPurchaseClick()
    } else if (purchaseUrl) {
      window.location.href = purchaseUrl
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Preview Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Preview Mode</h3>
              <p className="text-sm text-muted-foreground">
                You're viewing pages {previewPages.join(", ")} of the full content
              </p>
            </div>
            <Button onClick={handlePurchase} size="lg">
              Get Full Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flipbook Viewer */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src="/flipbook-viewer.html"
          className="w-full h-full border-0 rounded-lg"
          title="Preview Flipbook Viewer"
          allow="autoplay; fullscreen"
        />

        {/* Preview Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Preview
          </div>
        </div>
      </div>

      {/* Preview Footer */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              This is a limited preview. Get full access to experience all features including:
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Full Audio</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">All Pages</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Interactive Features</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Offline Access</span>
            </div>
            <Button onClick={handlePurchase} className="w-full sm:w-auto">
              Unlock Full Experience
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
