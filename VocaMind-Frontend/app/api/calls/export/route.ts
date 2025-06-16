import { NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const callsCollection = await getCollection("calls")

    // Get all calls
    const calls = await callsCollection.find({}).sort({ startTime: -1 }).toArray()

    // Transform data for CSV
    const csvData = calls.map((call) => ({
      "Phone Number": call.phoneNumber,
      "Contact Name": call.contactName,
      "Agent Name": call.agentName,
      Language: call.language,
      "Duration (seconds)": call.duration,
      "Duration (formatted)": formatDuration(call.duration),
      "Messages Count": call.transcript.length,
      Location: call.location,
      "Start Time": new Date(call.startTime).toISOString(),
      "End Time": new Date(call.endTime).toISOString(),
      Status: call.status,
      "Call SID": call.callSid,
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0])
    const csvRows = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(","),
      ),
    ]

    const csv = csvRows.join("\n")

    // Set headers for file download
    const headers2 = new Headers()
    headers2.append("Content-Type", "text/csv")
    headers2.append("Content-Disposition", "attachment; filename=call_analytics.csv")

    return new NextResponse(csv, {
      status: 200,
      headers: headers2,
    })
  } catch (error) {
    console.error("Error exporting calls:", error)
    return NextResponse.json({ error: "Failed to export calls" }, { status: 500 })
  }
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
