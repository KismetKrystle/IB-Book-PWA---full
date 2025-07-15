import { type NextRequest, NextResponse } from "next/server"
import { FinalDatabaseService } from "@/lib/final-database"

export async function POST(request: NextRequest) {
  try {
    const { adminToken, codeId, updates } = await request.json()

    const serverAdminToken = process.env.ADMIN_TOKEN

    if (!serverAdminToken) {
      console.error("ADMIN_TOKEN environment variable is not set on the server.")
      return NextResponse.json({ error: "Server configuration error: ADMIN_TOKEN is not set." }, { status: 500 })
    }

    if (adminToken !== serverAdminToken) {
      console.error("Unauthorized: Invalid admin token provided by client.")
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    const { data: updatedAccessCode, error } = await FinalDatabaseService.updateAccessCode(codeId, updates)

    if (error) {
      console.error("Error updating access code:", error)
      return NextResponse.json({ success: false, error: error }, { status: 500 })
    }

    return NextResponse.json({ success: true, accessCode: updatedAccessCode })
  } catch (error) {
    console.error("API error updating access code:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
