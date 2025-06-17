import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    // Get collections
    const contactsCollection = await getCollection("contacts")
    const policiesCollection = await getCollection("policies")
    const callsCollection = await getCollection("calls")

    // Count documents in each collection
    const contactsCount = await contactsCollection.countDocuments()
    const policiesCount = await policiesCollection.countDocuments()
    const callsCount = await callsCollection.countDocuments()

    // Calculate average call duration
    const callsAggregate = await callsCollection
      .aggregate([
        {
          $group: {
            _id: null,
            avgDuration: { $avg: "$duration" },
            totalMessages: { $sum: { $size: "$transcript" } },
          },
        },
      ])
      .toArray()

    const avgDuration = callsAggregate.length > 0 ? Math.round(callsAggregate[0].avgDuration / 60) || 0 : 0

    const totalMessages = callsAggregate.length > 0 ? callsAggregate[0].totalMessages || 0 : 0

    return NextResponse.json({
      contacts: contactsCount,
      policies: policiesCount,
      calls: callsCount,
      avgDuration,
      totalMessages,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        contacts: 0,
        policies: 0,
        calls: 0,
        avgDuration: 0,
        totalMessages: 0,
      },
      { status: 500 },
    )
  }
}
