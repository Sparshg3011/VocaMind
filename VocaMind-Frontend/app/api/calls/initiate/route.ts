import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { contacts, policyId } = await request.json()

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "No contacts provided" }, { status: 400 })
    }

    if (!policyId) {
      return NextResponse.json({ error: "No policy selected" }, { status: 400 })
    }

    // Get the policy
    const policiesCollection = await getCollection("policies")
    const policy = await policiesCollection.findOne({ _id: new ObjectId(policyId) })

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    // Simulate call initiation
    const callsCollection = await getCollection("calls")
    const now = new Date()

    const callPromises = contacts.map(async (contact: any) => {
      // Generate a random call duration between 1 and 10 minutes
      const duration = Math.floor(Math.random() * 540) + 60 // 60 to 600 seconds

      // Generate a random number of messages between 5 and 20
      const messageCount = Math.floor(Math.random() * 16) + 5

      // Generate sample transcript
      const transcript = Array.from({ length: messageCount }, (_, i) => ({
        timestamp: new Date(now.getTime() + i * 10000).toISOString(),
        role: i % 2 === 0 ? "AI_Agent" : "User",
        text:
          i % 2 === 0
            ? `This is a sample message from the AI agent (${i + 1})`
            : `This is a sample response from the user (${i + 1})`,
      }))

      // Get country code from phone number
      const countryCode = contact.phone_number.startsWith("+") ? contact.phone_number.substring(1, 3) : "Unknown"

      // Map country codes to locations (simplified)
      const locationMap: Record<string, string> = {
        "1": "United States",
        "44": "United Kingdom",
        "91": "India",
        "61": "Australia",
        "49": "Germany",
        "33": "France",
        "86": "China",
        "81": "Japan",
      }

      const location = locationMap[countryCode] || "Unknown"

      return callsCollection.insertOne({
        contactId: new ObjectId(contact._id),
        policyId: new ObjectId(policyId),
        phoneNumber: contact.phone_number,
        language: contact.language,
        contactName: contact.name,
        agentName: policy.agentName,
        prompt: policy.prompt,
        callSid: `SIM${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: "completed",
        duration,
        startTime: now,
        endTime: new Date(now.getTime() + duration * 1000),
        transcript,
        location,
        createdAt: now,
      })
    })

    await Promise.all(callPromises)

    return NextResponse.json({
      message: "Calls initiated successfully",
      initiatedCalls: contacts.length,
    })
  } catch (error) {
    console.error("Error initiating calls:", error)
    return NextResponse.json({ error: "Failed to initiate calls" }, { status: 500 })
  }
}
