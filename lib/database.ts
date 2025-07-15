import { supabase, supabaseAdmin, type AccessCode, type PurchaseLink } from "./supabase"

export class DatabaseService {
  // Access Code Management
  static async createAccessCode(data: {
    type: "purchase" | "promotional"
    maxUses?: number
    expiresInDays?: number
    notes?: string
    customerEmail?: string
    paymentId?: string
  }): Promise<{ data: AccessCode | null; error: string | null }> {
    try {
      // Generate unique code
      let code: string
      let isUnique = false

      do {
        code = Math.random().toString(36).substring(2, 10).toUpperCase()
        const { data: existing } = await supabaseAdmin.from("access_codes").select("id").eq("code", code).single()

        isUnique = !existing
      } while (!isUnique)

      const expiresAt = data.expiresInDays
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { data: accessCode, error } = await supabaseAdmin
        .from("access_codes")
        .insert({
          code,
          type: data.type,
          max_uses: data.maxUses || 3,
          expires_at: expiresAt,
          notes: data.notes,
          customer_email: data.customerEmail,
          payment_id: data.paymentId,
        })
        .select()
        .single()

      if (error) throw error

      return { data: accessCode, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async validateAccessCode(
    code: string,
    deviceFingerprint: string,
  ): Promise<{
    valid: boolean
    message: string
    accessCode?: AccessCode
    sessionToken?: string
  }> {
    try {
      const { data: accessCode, error } = await supabaseAdmin
        .from("access_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("active", true)
        .single()

      if (error || !accessCode) {
        return { valid: false, message: "Invalid access code" }
      }

      // Check if expired
      if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
        return { valid: false, message: "Access code has expired" }
      }

      // Check if device already registered
      const devices = accessCode.devices as string[]
      if (devices.includes(deviceFingerprint)) {
        // Generate session token
        const sessionToken = Math.random().toString(36).substring(2, 15)
        return {
          valid: true,
          message: "Welcome back! Device already registered.",
          accessCode,
          sessionToken,
        }
      }

      // Check if max uses reached
      if (accessCode.current_uses >= accessCode.max_uses) {
        return { valid: false, message: "Access code has reached maximum number of devices" }
      }

      // Register new device
      const updatedDevices = [...devices, deviceFingerprint]
      const { error: updateError } = await supabaseAdmin
        .from("access_codes")
        .update({
          devices: updatedDevices,
          current_uses: accessCode.current_uses + 1,
        })
        .eq("id", accessCode.id)

      if (updateError) throw updateError

      // Generate session token
      const sessionToken = Math.random().toString(36).substring(2, 15)

      return {
        valid: true,
        message: "Access granted! Device registered.",
        accessCode: { ...accessCode, devices: updatedDevices },
        sessionToken,
      }
    } catch (error) {
      return { valid: false, message: "Validation failed. Please try again." }
    }
  }

  static async getAllAccessCodes(): Promise<{ data: AccessCode[]; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from("access_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: (error as Error).message }
    }
  }

  // Purchase Link Management
  static async createPurchaseLink(data: {
    name: string
    price: number
    description?: string
    hasExpiration?: boolean
    expirationDate?: string
  }): Promise<{ data: PurchaseLink | null; error: string | null }> {
    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      const { data: purchaseLink, error } = await supabaseAdmin
        .from("purchase_links")
        .insert({
          name: data.name,
          slug,
          price: data.price,
          description: data.description,
          has_expiration: data.hasExpiration || false,
          expires_at: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
        })
        .select()
        .single()

      if (error) throw error

      return { data: purchaseLink, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getPurchaseLinkBySlug(slug: string): Promise<{ data: PurchaseLink | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("purchase_links")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getDefaultPurchaseLink(): Promise<{ data: PurchaseLink | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from("purchase_links")
        .select("*")
        .eq("is_default", true)
        .eq("active", true)
        .single()

      if (error) {
        // Fallback to first active link
        const { data: fallback, error: fallbackError } = await supabase
          .from("purchase_links")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .single()

        return { data: fallback, error: fallbackError?.message || null }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getAllPurchaseLinks(): Promise<{ data: PurchaseLink[]; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from("purchase_links")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (error) {
      return { data: [], error: (error as Error).message }
    }
  }

  static async updatePurchaseLink(
    id: string,
    updates: Partial<PurchaseLink>,
  ): Promise<{ data: PurchaseLink | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin.from("purchase_links").update(updates).eq("id", id).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async incrementPurchaseLinkClick(slug: string): Promise<void> {
    try {
      await supabaseAdmin.rpc("increment_link_clicks", { link_slug: slug })
    } catch (error) {
      console.error("Failed to increment click:", error)
    }
  }

  static async incrementPurchaseLinkPurchase(slug: string): Promise<void> {
    try {
      await supabaseAdmin.rpc("increment_link_purchases", { link_slug: slug })
    } catch (error) {
      console.error("Failed to increment purchase:", error)
    }
  }

  // Analytics
  static async trackEvent(
    eventType: string,
    data: {
      purchaseLinkId?: string
      accessCodeId?: string
      userEmail?: string
      metadata?: Record<string, any>
    },
  ): Promise<void> {
    try {
      await supabaseAdmin.from("analytics").insert({
        event_type: eventType,
        purchase_link_id: data.purchaseLinkId,
        access_code_id: data.accessCodeId,
        user_email: data.userEmail,
        metadata: data.metadata || {},
      })
    } catch (error) {
      console.error("Failed to track event:", error)
    }
  }

  static async getAnalytics(days = 30): Promise<{ data: any; error: string | null }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabaseAdmin
        .from("analytics")
        .select("*")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Process analytics data
      const analytics = {
        totalEvents: data.length,
        eventsByType: data.reduce((acc: any, event: any) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1
          return acc
        }, {}),
        dailyEvents: data.reduce((acc: any, event: any) => {
          const date = new Date(event.created_at).toDateString()
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {}),
      }

      return { data: analytics, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }
}
