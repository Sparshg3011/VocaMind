import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const skip = page * limit

    const callsCollection = await getCollection("calls")

    // Build search query
    const query: any = {}
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: "i" } },
        { contactName: { $regex: search, $options: "i" } },
        { agentName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ]
    }

    // Get total count
    const total = await callsCollection.countDocuments(query)

    // Get paginated calls
    const calls = await callsCollection.find(query).sort({ startTime: -1 }).skip(skip).limit(limit).toArray()

    return NextResponse.json({ calls, total })
  } catch (error) {
    console.error("Error fetching calls:", error)
    return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 })
  }
}
