import { type NextRequest, NextResponse } from "next/server"

// Simple demo codes - back to original format
const demoCodes = new Map([
  [
    "DEMO123",
    { maxUses: 3, currentUses: 0, devices: [], type: "promotional", active: true, notes: "Demo code for testing" },
  ],
  [
    "PROMO2024",
    { maxUses: 5, currentUses: 0, devices: [], type: "promotional", active: true, notes: "Promotional giveaway code" },
  ],
  [
    "TEST456",
    { maxUses: 3, currentUses: 0, devices: [], type: "promotional", active: true, notes: "Test code for development" },
  ],
  [
    "HOLIDAY999",
    {
      maxUses: 10,
      currentUses: 0,
      devices: [],
      type: "promotional",
      active: true,
      notes: "Holiday special promotional code",
    },
  ],
  [
    "STUDENT100",
    { maxUses: 5, currentUses: 0, devices: [], type: "promotional", active: true, notes: "Student discount code" },
  ],
  [
    "REVIEW200",
    { maxUses: 3, currentUses: 0, devices: [], type: "promotional", active: true, notes: "Review bonus code" },
  ],
  ["VIP888", { maxUses: 1, currentUses: 0, devices: [], type: "promotional", active: true, notes: "VIP access code" }],
])

export async function POST(request: NextRequest) {
  try {
    const { accessCode, deviceFingerprint } = await request.json()

    if (!accessCode) {
      return NextResponse.json({
        success: false,
        message: "Access code required",
      })
    }

    // Simple cleanup - just uppercase and remove spaces
    const cleanCode = accessCode.toUpperCase().replace(/\s+/g, "")

    const codeData = demoCodes.get(cleanCode)

    if (!codeData) {
      return NextResponse.json({
        success: false,
        message: "Invalid access code",
      })
    }

    if (!codeData.active) {
      return NextResponse.json({
        success: false,
        message: "Access code is no longer active",
      })
    }

    // Generate device fingerprint if not provided
    const finalDeviceFingerprint = deviceFingerprint || Math.random().toString(36).substring(2, 15)

    // Check if device already registered
    if (codeData.devices.includes(finalDeviceFingerprint)) {
      return NextResponse.json({
        success: true,
        sessionToken: Math.random().toString(36).substring(2, 15),
        message: "Welcome back! Device already registered.",
        usesRemaining: codeData.maxUses - codeData.currentUses,
        codeInfo: {
          code: cleanCode,
          type: codeData.type,
          notes: codeData.notes,
          maxUses: codeData.maxUses,
          currentUses: codeData.currentUses,
        },
      })
    }

    // Check if max uses reached
    if (codeData.currentUses >= codeData.maxUses) {
      return NextResponse.json({
        success: false,
        message: `Access code has reached maximum number of devices (${codeData.maxUses})`,
      })
    }

    // Register new device
    codeData.devices.push(finalDeviceFingerprint)
    codeData.currentUses++
    demoCodes.set(cleanCode, codeData)

    return NextResponse.json({
      success: true,
      sessionToken: Math.random().toString(36).substring(2, 15),
      message: "Access granted! Device registered.",
      usesRemaining: codeData.maxUses - codeData.currentUses,
      codeInfo: {
        code: cleanCode,
        type: codeData.type,
        notes: codeData.notes,
        maxUses: codeData.maxUses,
        currentUses: codeData.currentUses,
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
