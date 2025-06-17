import { type NextRequest, NextResponse } from "next/server"

interface SuggestionRequest {
  agentName: string
  context?: string
}

export async function POST(request: NextRequest) {
  try {
    const { agentName, context }: SuggestionRequest = await request.json()

    if (!agentName) {
      return NextResponse.json({ error: "Agent name is required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." }, { status: 500 })
    }

    // Use OpenAI to generate a single, unique suggestion
    const OpenAI = (await import("openai")).default
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `Create a CONCISE AI agent script for a "${agentName}" role. This should be a focused, professional script for voice/phone calls.

CRITICAL: Keep the response under 500 characters total (about 2-3 sentences maximum).

Include only the most essential elements:
- Brief role description and objective
- Key tone/approach
- One example phrase or greeting

Make it specific to "${agentName}" but keep it SHORT and direct.

Agent Name: ${agentName}
Context: ${context === "update" ? "This is for updating an existing policy" : "This is for creating a new policy"}

IMPORTANT: Maximum 500 characters. Return only the script content, no formatting.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert AI script writer specializing in creating unique, role-specific voice agent instructions. Generate highly personalized scripts that are distinct for each agent type. Avoid generic templates and focus on role-specific language, objectives, and approaches."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200, // Reduced to enforce shorter responses
    })

    const suggestion = completion.choices[0]?.message?.content

    if (!suggestion) {
      throw new Error("No response from OpenAI")
    }

    return NextResponse.json({ 
      suggestion: suggestion.trim(),
      agentName,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error generating suggestion:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ 
          error: "OpenAI API configuration error. Please check your API key." 
        }, { status: 500 })
      }
      if (error.message.includes("insufficient_quota")) {
        return NextResponse.json({ 
          error: "OpenAI API quota exceeded. Please check your account." 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      error: "Failed to generate suggestion. Please try again." 
    }, { status: 500 })
  }
} 