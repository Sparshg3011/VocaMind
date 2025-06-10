import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/mongodb"

export async function GET() {
  try {
    const policiesCollection = await getCollection("policies")
    const policies = await policiesCollection.find({}).sort({ updatedAt: -1 }).toArray()

    return NextResponse.json({ policies })
  } catch (error) {
    console.error("Error fetching policies:", error)
    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { agentName, prompt } = await request.json()

    if (!agentName || !prompt) {
      return NextResponse.json({ error: "Agent name and prompt are required" }, { status: 400 })
    }

    const now = new Date()
    const policiesCollection = await getCollection("policies")

    const result = await policiesCollection.insertOne({
      agentName,
      prompt,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({
      message: "Policy created successfully",
      policyId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating policy:", error)
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 })
  }
}
