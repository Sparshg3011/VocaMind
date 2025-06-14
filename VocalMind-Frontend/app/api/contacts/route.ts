import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "0")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = page * limit

    const contactsCollection = await getCollection("contacts")

    // Get total count
    const total = await contactsCollection.countDocuments()

    // Get paginated contacts
    const contacts = await contactsCollection.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()

    return NextResponse.json({ contacts, total })
  } catch (error) {
    console.error("Error fetching contacts:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const contactsCollection = await getCollection("contacts")
    await contactsCollection.deleteMany({})

    return NextResponse.json({ message: "All contacts deleted successfully" })
  } catch (error) {
    console.error("Error deleting contacts:", error)
    return NextResponse.json({ error: "Failed to delete contacts" }, { status: 500 })
  }
}
