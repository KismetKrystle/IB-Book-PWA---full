// Client-side caching utility as fallback
export class OfflineCache {
  private static instance: OfflineCache
  private cache: Map<string, any> = new Map()

  static getInstance(): OfflineCache {
    if (!OfflineCache.instance) {
      OfflineCache.instance = new OfflineCache()
    }
    return OfflineCache.instance
  }

  set(key: string, value: any): void {
    try {
      this.cache.set(key, value)
      localStorage.setItem(`cache_${key}`, JSON.stringify(value))
    } catch (error) {
      console.log("Cache storage failed:", error)
    }
  }

  get(key: string): any {
    try {
      if (this.cache.has(key)) {
        return this.cache.get(key)
      }

      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const value = JSON.parse(stored)
        this.cache.set(key, value)
        return value
      }
    } catch (error) {
      console.log("Cache retrieval failed:", error)
    }
    return null
  }

  clear(): void {
    this.cache.clear()
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("cache_")) {
        localStorage.removeItem(key)
      }
    })
  }
}
