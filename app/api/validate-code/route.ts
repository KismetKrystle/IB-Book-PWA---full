import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { accessCode, deviceFingerprint } = await request.json()

    if (!accessCode) {
      return NextResponse.json({
        success: false,
        message: "Access code required",
      })
    }

    const supabase = createClient()
    const cleanCode = accessCode.toUpperCase().replace(/\s+/g, "")

    const { data: codeData, error } = await supabase.from("access_codes").select("*").eq("code", cleanCode).single()

    if (error || !codeData) {
      console.error("Error fetching access code:", error?.message || "Code not found")
      return NextResponse.json({
        success: false,
        message: "Invalid access code",
      })
    }

    if (!codeData.is_active) {
      return NextResponse.json({
        success: false,
        message: "Access code is no longer active",
      })
    }

    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return NextResponse.json({
        success: false,
        message: "Access code has expired",
      })
    }

    // Generate device fingerprint if not provided (for new devices)
    const finalDeviceFingerprint = deviceFingerprint || Math.random().toString(36).substring(2, 15)

    // Check if device already registered
    const { data: existingDevice, error: deviceError } = await supabase
      .from("access_code_devices")
      .select("*")
      .eq("access_code_id", codeData.id)
      .eq("device_fingerprint", finalDeviceFingerprint)
      .single()

    if (existingDevice) {
      return NextResponse.json({
        success: true,
        sessionToken: Math.random().toString(36).substring(2, 15), // Generate a session token
        message: "Welcome back! Device already registered.",
        usesRemaining: codeData.usage_limit !== null ? codeData.usage_limit - codeData.current_usage : null,
        codeInfo: {
          id: codeData.id,
          code: codeData.code,
          type: codeData.purchase_link_id ? "purchase" : "promotional", // Infer type based on purchase_link_id
          maxUses: codeData.usage_limit,
          currentUses: codeData.current_usage,
          expiresAt: codeData.expires_at,
        },
      })
    }

    // Check if max uses reached (if usage_limit is set)
    if (codeData.usage_limit !== null && codeData.current_usage >= codeData.usage_limit) {
      return NextResponse.json({
        success: false,
        message: `Access code has reached maximum number of uses (${codeData.usage_limit})`,
      })
    }

    // Register new device and increment current_usage
    const { error: insertDeviceError } = await supabase.from("access_code_devices").insert({
      access_code_id: codeData.id,
      device_fingerprint: finalDeviceFingerprint,
    })

    if (insertDeviceError) {
      console.error("Error inserting device:", insertDeviceError.message)
      return NextResponse.json({ success: false, message: "Failed to register device" }, { status: 500 })
    }

    const { data: updatedCodeData, error: updateCodeError } = await supabase
      .from("access_codes")
      .update({ current_usage: codeData.current_usage + 1 })
      .eq("id", codeData.id)
      .select()
      .single()

    if (updateCodeError || !updatedCodeData) {
      console.error("Error updating access code usage:", updateCodeError?.message || "Failed to update usage")
      return NextResponse.json({ success: false, message: "Failed to update usage" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionToken: Math.random().toString(36).substring(2, 15), // Generate a session token
      message: "Access granted! Device registered.",
      usesRemaining:
        updatedCodeData.usage_limit !== null ? updatedCodeData.usage_limit - updatedCodeData.current_usage : null,
      codeInfo: {
        id: updatedCodeData.id,
        code: updatedCodeData.code,
        type: updatedCodeData.purchase_link_id ? "purchase" : "promotional",
        maxUses: updatedCodeData.usage_limit,
        currentUses: updatedCodeData.current_usage,
        expiresAt: updatedCodeData.expires_at,
      },
    })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
