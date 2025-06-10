import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const callsCollection = await getCollection("calls")

    // Get total calls
    const totalCalls = await callsCollection.countDocuments()

    // Get average duration and total messages
    const durationStats = await callsCollection
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

    const avgDuration = durationStats.length > 0 ? Math.round(durationStats[0].avgDuration) : 0
    const totalMessages = durationStats.length > 0 ? durationStats[0].totalMessages : 0

    // Get calls by language
    const callsByLanguage = await callsCollection
      .aggregate([
        {
          $group: {
            _id: "$language",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            language: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ])
      .toArray()

    // Get calls by location
    const callsByLocation = await callsCollection
      .aggregate([
        {
          $group: {
            _id: "$location",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            location: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ])
      .toArray()

    return NextResponse.json({
      totalCalls,
      avgDuration,
      totalMessages,
      callsByLanguage,
      callsByLocation,
    })
  } catch (error) {
    console.error("Error fetching call statistics:", error)
    return NextResponse.json({ error: "Failed to fetch call statistics" }, { status: 500 })
  }
}
