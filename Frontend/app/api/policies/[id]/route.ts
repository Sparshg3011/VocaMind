import { type NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCollection } from "@/lib/mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 })
    }

    const policiesCollection = await getCollection("policies")
    const policy = await policiesCollection.findOne({ _id: new ObjectId(id) })

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({ policy })
  } catch (error) {
    console.error("Error fetching policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 })
    }

    const { agentName, prompt } = await request.json()

    if (!agentName || !prompt) {
      return NextResponse.json({ error: "Agent name and prompt are required" }, { status: 400 })
    }

    const policiesCollection = await getCollection("policies")

    const result = await policiesCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          agentName,
          prompt,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Policy updated successfully",
    })
  } catch (error) {
    console.error("Error updating policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid policy ID" }, { status: 400 })
    }

    const policiesCollection = await getCollection("policies")

    const result = await policiesCollection.deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Policy deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting policy:", error)
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 })
  }
}
