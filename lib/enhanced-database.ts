import { supabase, supabaseAdmin } from "./supabase"

export interface EnhancedAccessCode {
  id: string
  code: string
  customer_name?: string
  customer_email?: string
  payment_processor?: "stripe" | "paypal" | "wise"
  transaction_id?: string
  amount_paid?: number
  currency: string
  payment_date?: string
  max_uses: number
  current_uses: number
  devices: string[]
  active: boolean
  expires_at?: string
  created_at: string
  type: "purchase" | "promotional" | "manual"
  notes?: string
  purchase_link_id?: string
  created_by: string
}

export interface EnhancedPurchaseLink {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  description?: string
  stripe_enabled: boolean
  paypal_enabled: boolean
  wise_enabled: boolean
  clicks: number
  purchases: number
  revenue: number
  active: boolean
  is_default: boolean
  has_expiration: boolean
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface PaymentTransaction {
  id: string
  transaction_id: string
  payment_processor: string
  status: string
  customer_email: string
  customer_name?: string
  amount: number
  currency: string
  purchase_link_id?: string
  access_code_id?: string
  webhook_data?: any
  created_at: string
  completed_at?: string
}

export interface AdvancedAnalytics {
  total_clicks: number
  total_purchases: number
  total_revenue: number
  conversion_rate: number
  avg_order_value: number
  daily_stats: Array<{
    date: string
    clicks: number
    purchases: number
    revenue: number
  }>
  geographic_stats: Array<{
    country: string
    clicks: number
    purchases: number
    revenue: number
  }>
  device_stats: Array<{
    device_type: string
    clicks: number
    purchases: number
  }>
  payment_processor_stats: Array<{
    processor: string
    purchases: number
    revenue: number
  }>
}

export class EnhancedDatabaseService {
  // Access Code Management
  static async createAccessCode(data: {
    type: "purchase" | "promotional" | "manual"
    customer_name?: string
    customer_email?: string
    payment_processor?: "stripe" | "paypal" | "wise"
    transaction_id?: string
    amount_paid?: number
    currency?: string
    purchase_link_id?: string
    max_uses?: number
    expires_at?: string
    notes?: string
    created_by?: string
  }): Promise<{ data: EnhancedAccessCode | null; error: string | null }> {
    try {
      if (
        data.type === "purchase" &&
        data.customer_email &&
        data.payment_processor &&
        data.transaction_id &&
        data.amount_paid
      ) {
        // Use the database function for purchase codes
        const { data: result, error } = await supabaseAdmin.rpc("create_purchase_access_code", {
          p_customer_name: data.customer_name,
          p_customer_email: data.customer_email,
          p_payment_processor: data.payment_processor,
          p_transaction_id: data.transaction_id,
          p_amount: data.amount_paid,
          p_currency: data.currency || "USD",
          p_purchase_link_id: data.purchase_link_id,
        })

        if (error) throw error

        // Get the full access code data
        const { data: accessCode, error: fetchError } = await supabaseAdmin
          .from("access_codes")
          .select("*")
          .eq("id", result[0].code_id)
          .single()

        if (fetchError) throw fetchError

        return { data: accessCode, error: null }
      } else {
        // Manual/promotional code creation
        const { data: accessCode, error } = await supabaseAdmin
          .from("access_codes")
          .insert({
            code: await this.generateUniqueCode(),
            type: data.type,
            customer_name: data.customer_name,
            customer_email: data.customer_email,
            max_uses: data.max_uses || 3,
            expires_at: data.expires_at,
            notes: data.notes,
            created_by: data.created_by || "admin",
          })
          .select()
          .single()

        if (error) throw error

        return { data: accessCode, error: null }
      }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async updateAccessCode(
    id: string,
    updates: Partial<EnhancedAccessCode>,
  ): Promise<{ data: EnhancedAccessCode | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin.from("access_codes").update(updates).eq("id", id).select().single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getAllAccessCodes(): Promise<{ data: EnhancedAccessCode[]; error: string | null }> {
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

  static async validateAccessCode(
    code: string,
    deviceFingerprint: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{
    valid: boolean
    message: string
    accessCode?: EnhancedAccessCode
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
        // Create new session for existing device
        const sessionToken = await this.createUserSession(
          accessCode.id,
          accessCode.customer_email || "",
          deviceFingerprint,
          userAgent,
          ipAddress,
        )
        return {
          valid: true,
          message: "Welcome back! Device already registered.",
          accessCode,
          sessionToken,
        }
      }

      // Check if max uses reached
      if (accessCode.current_uses >= accessCode.max_uses) {
        return { valid: false, message: `Access code has reached maximum number of devices (${accessCode.max_uses})` }
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

      // Create user session
      const sessionToken = await this.createUserSession(
        accessCode.id,
        accessCode.customer_email || "",
        deviceFingerprint,
        userAgent,
        ipAddress,
      )

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

  // Purchase Link Management
  static async createPurchaseLink(data: {
    name: string
    price: number
    description?: string
    stripe_enabled?: boolean
    paypal_enabled?: boolean
    wise_enabled?: boolean
    has_expiration?: boolean
    expires_at?: string
  }): Promise<{ data: EnhancedPurchaseLink | null; error: string | null }> {
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
          stripe_enabled: data.stripe_enabled ?? true,
          paypal_enabled: data.paypal_enabled ?? true,
          wise_enabled: data.wise_enabled ?? true,
          has_expiration: data.has_expiration || false,
          expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        })
        .select()
        .single()

      if (error) throw error

      return { data: purchaseLink, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getAllPurchaseLinks(): Promise<{ data: EnhancedPurchaseLink[]; error: string | null }> {
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
    updates: Partial<EnhancedPurchaseLink>,
  ): Promise<{ data: EnhancedPurchaseLink | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin
        .from("purchase_links")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async getPurchaseLinkBySlug(
    slug: string,
  ): Promise<{ data: EnhancedPurchaseLink | null; error: string | null }> {
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

  // Analytics
  static async getAdvancedAnalytics(
    daysBack = 30,
    linkId?: string,
  ): Promise<{ data: AdvancedAnalytics | null; error: string | null }> {
    try {
      const { data, error } = await supabaseAdmin.rpc("get_advanced_analytics", {
        days_back: daysBack,
        link_id: linkId || null,
      })

      if (error) throw error

      return { data: data[0] || null, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  static async trackLinkClick(
    slug: string,
    userData: {
      country?: string
      device_type?: string
      browser?: string
      os?: string
      ip_address?: string
    } = {},
  ): Promise<void> {
    try {
      await supabaseAdmin.rpc("increment_link_clicks", {
        link_slug: slug,
        user_data: userData,
      })
    } catch (error) {
      console.error("Failed to track link click:", error)
    }
  }

  // Payment Processing
  static async createPaymentTransaction(data: {
    transaction_id: string
    payment_processor: string
    status: string
    customer_email: string
    customer_name?: string
    amount: number
    currency?: string
    purchase_link_id?: string
    webhook_data?: any
  }): Promise<{ data: PaymentTransaction | null; error: string | null }> {
    try {
      const { data: transaction, error } = await supabaseAdmin
        .from("payment_transactions")
        .insert({
          transaction_id: data.transaction_id,
          payment_processor: data.payment_processor,
          status: data.status,
          customer_email: data.customer_email,
          customer_name: data.customer_name,
          amount: data.amount,
          currency: data.currency || "USD",
          purchase_link_id: data.purchase_link_id,
          webhook_data: data.webhook_data,
        })
        .select()
        .single()

      if (error) throw error

      return { data: transaction, error: null }
    } catch (error) {
      return { data: null, error: (error as Error).message }
    }
  }

  // Helper Methods
  private static async generateUniqueCode(): Promise<string> {
    const { data, error } = await supabaseAdmin.rpc("generate_access_code")
    if (error) throw error
    return data
  }

  private static async createUserSession(
    accessCodeId: string,
    email: string,
    deviceFingerprint: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabaseAdmin.from("user_sessions").insert({
      access_code_id: accessCodeId,
      session_token: sessionToken,
      device_fingerprint: deviceFingerprint,
      email,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt.toISOString(),
    })

    return sessionToken
  }
}
