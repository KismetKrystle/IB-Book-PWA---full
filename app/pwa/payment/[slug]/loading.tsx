import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      <p className="mt-4 text-lg text-gray-600">Loading payment options...</p>
    </div>
  )
}
