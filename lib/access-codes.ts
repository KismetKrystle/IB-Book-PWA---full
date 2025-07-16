import { createClient } from "./supabase"

export async function validateAccessCode(code: string, deviceFingerprint: string) {
  const supabase = createClient()

  const { data: accessCode, error: codeError } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code)
    .single()

  if (codeError || !accessCode) {
    return { success: false, message: "Invalid access code." }
  }

  if (!accessCode.is_active) {
    return { success: false, message: "Access code is inactive." }
  }

  if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
    return { success: false, message: "Access code has expired." }
  }

  // Check if device is already registered
  const { data: existingDevice, error: deviceError } = await supabase
    .from("access_code_devices")
    .select("*")
    .eq("access_code_id", accessCode.id)
    .eq("device_fingerprint", deviceFingerprint)
    .single()

  if (existingDevice) {
    return {
      success: true,
      message: "Device already registered. Access granted.",
      codeInfo: accessCode,
    }
  }

  // Check usage limit
  if (accessCode.usage_limit !== null && accessCode.current_usage >= accessCode.usage_limit) {
    return { success: false, message: "Access code has reached its maximum usage limit." }
  }

  // Register new device and increment usage
  const { error: insertDeviceError } = await supabase.from("access_code_devices").insert({
    access_code_id: accessCode.id,
    device_fingerprint: deviceFingerprint,
  })

  if (insertDeviceError) {
    console.error("Error registering device:", insertDeviceError.message)
    return { success: false, message: "Failed to register device." }
  }

  const { data: updatedAccessCode, error: updateError } = await supabase
    .from("access_codes")
    .update({ current_usage: accessCode.current_usage + 1 })
    .eq("id", accessCode.id)
    .select()
    .single()

  if (updateError || !updatedAccessCode) {
    console.error("Error updating access code usage:", updateError?.message || "Failed to update usage.")
    return { success: false, message: "Failed to update access code usage." }
  }

  return {
    success: true,
    message: "Access granted. Device registered.",
    codeInfo: updatedAccessCode,
  }
}

export async function createAccessCode(
  code: string,
  usageLimit: number | null,
  expiresAt: string | null,
  isActive: boolean,
  purchaseLinkId: string | null,
  customerName: string | null,
  customerEmail: string | null,
  transactionId: string | null,
  amountPaid: number | null,
  currency: string | null,
  paymentProcessor: string | null,
  purchaseDate: string | null,
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("access_codes")
    .insert({
      code,
      usage_limit: usageLimit,
      expires_at: expiresAt,
      is_active: isActive,
      purchase_link_id: purchaseLinkId,
      customer_name: customerName,
      customer_email: customerEmail,
      transaction_id: transactionId,
      amount_paid: amountPaid,
      currency: currency,
      payment_processor: paymentProcessor,
      purchase_date: purchaseDate,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function updateAccessCode(
  id: string,
  updates: {
    usage_limit?: number | null
    expires_at?: string | null
    is_active?: boolean
    customer_name?: string | null
    customer_email?: string | null
  },
) {
  const supabase = createClient()
  const { data, error } = await supabase.from("access_codes").update(updates).eq("id", id).select().single()

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export async function deleteAccessCode(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from("access_codes").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
  return { success: true }
}

export async function listAccessCodes() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("access_codes")
    .select(
      `
      *,
      purchase_links (
        slug,
        price,
        currency,
        description,
        is_free
      )
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }
  return data
}
