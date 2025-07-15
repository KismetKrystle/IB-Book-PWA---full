export interface AccessCode {
  code: string
  maxUses: number
  currentUses: number
  createdAt: string
  expiresAt?: string
  devices: string[] // Device fingerprints
  type: "purchase" | "promotional"
  notes?: string
}

// In production, this would be a real database
// For now, we'll use localStorage with a fallback
class AccessCodeManager {
  private static instance: AccessCodeManager
  private codes: Map<string, AccessCode> = new Map()

  static getInstance(): AccessCodeManager {
    if (!AccessCodeManager.instance) {
      AccessCodeManager.instance = new AccessCodeManager()
    }
    return AccessCodeManager.instance
  }

  constructor() {
    this.loadCodes()
  }

  private loadCodes() {
    try {
      const stored = localStorage.getItem("infiniteBloomAccessCodes")
      if (stored) {
        const codesArray = JSON.parse(stored)
        this.codes = new Map(codesArray)
      } else {
        // Initialize with some demo codes
        this.initializeDemoCodes()
      }
    } catch (error) {
      console.error("Failed to load access codes:", error)
      this.initializeDemoCodes()
    }
  }

  private saveCodes() {
    try {
      const codesArray = Array.from(this.codes.entries())
      localStorage.setItem("infiniteBloomAccessCodes", JSON.stringify(codesArray))
    } catch (error) {
      console.error("Failed to save access codes:", error)
    }
  }

  private initializeDemoCodes() {
    const demoCodes: AccessCode[] = [
      {
        code: "DEMO123",
        maxUses: 3,
        currentUses: 0,
        devices: [],
        createdAt: new Date().toISOString(),
        type: "promotional",
        notes: "Demo code for testing",
      },
      {
        code: "PROMO2024",
        maxUses: 3,
        currentUses: 0,
        devices: [],
        createdAt: new Date().toISOString(),
        type: "promotional",
        notes: "Promotional giveaway code",
      },
    ]

    demoCodes.forEach((code) => {
      this.codes.set(code.code, code)
    })
    this.saveCodes()
  }

  generateDeviceFingerprint(): string {
    // Simple device fingerprinting
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    ctx!.textBaseline = "top"
    ctx!.font = "14px Arial"
    ctx!.fillText("Device fingerprint", 2, 2)

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|")

    // Simple hash
    let hash = 0
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  validateCode(code: string, deviceFingerprint: string): { valid: boolean; message: string; accessCode?: AccessCode } {
    const accessCode = this.codes.get(code.toUpperCase())

    if (!accessCode) {
      return { valid: false, message: "Invalid access code" }
    }

    // Check if code has expired
    if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) {
      return { valid: false, message: "Access code has expired" }
    }

    // Check if device already used this code
    if (accessCode.devices.includes(deviceFingerprint)) {
      return { valid: true, message: "Welcome back! Device already registered.", accessCode }
    }

    // Check if max uses reached
    if (accessCode.currentUses >= accessCode.maxUses) {
      return { valid: false, message: "Access code has reached maximum number of devices (3)" }
    }

    // Valid new device usage
    accessCode.devices.push(deviceFingerprint)
    accessCode.currentUses++
    this.codes.set(code.toUpperCase(), accessCode)
    this.saveCodes()

    return { valid: true, message: "Access granted! Device registered.", accessCode }
  }

  createCode(type: "purchase" | "promotional", maxUses = 3, expiresInDays?: number, notes?: string): AccessCode {
    const code = this.generateAccessCode()
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    const accessCode: AccessCode = {
      code,
      maxUses,
      currentUses: 0,
      devices: [],
      createdAt: new Date().toISOString(),
      expiresAt,
      type,
      notes,
    }

    this.codes.set(code, accessCode)
    this.saveCodes()
    return accessCode
  }

  private generateAccessCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  getAllCodes(): AccessCode[] {
    return Array.from(this.codes.values())
  }

  getCodeStats(code: string): AccessCode | undefined {
    return this.codes.get(code.toUpperCase())
  }
}

export default AccessCodeManager
