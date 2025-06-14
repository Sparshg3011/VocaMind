import { type NextRequest, NextResponse } from "next/server"
import { parse } from "csv-parse/sync"
import { getCollection } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = ["phone_number", "language", "name"]
    const firstRecord = records[0]

    const missingFields = requiredFields.filter((field) => !(field in firstRecord))
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `CSV is missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
    }

    // Prepare contacts for insertion
    const contacts = records.map((record) => ({
      phone_number: record.phone_number.trim(),
      language: record.language.trim().toLowerCase(),
      name: record.name.trim(),
      createdAt: new Date(),
    }))

    // Insert contacts into database
    const contactsCollection = await getCollection("contacts")
    const result = await contactsCollection.insertMany(contacts)

    return NextResponse.json({
      message: "Contacts uploaded successfully",
      count: result.insertedCount,
    })
  } catch (error) {
    console.error("Error uploading contacts:", error)
    return NextResponse.json({ error: "Failed to upload contacts" }, { status: 500 })
  }
}
