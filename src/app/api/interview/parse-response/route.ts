import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { env } from "~/config/server";

interface ExtractedFields {
  emotion?: string;
  trigger?: string;
  expectation?: string;
  value?: string;
  thinking_pattern?: string;
  core_belief?: string;
  sensitivity?: string;
  pain_point?: string;
  relationship_pattern?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userResponse, currentQuestion, collectedFields } = await request.json();

    if (!userResponse || !currentQuestion) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });

    // Build the extraction prompt
    const extractionPrompt = buildExtractionPrompt(userResponse, currentQuestion, collectedFields);

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: extractionPrompt,
        },
      ],
    });

    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Could not extract JSON from OpenAI response:", content);
      return NextResponse.json({
        extractedFields: {},
        rawResponse: content,
      });
    }

    const extractedFields: ExtractedFields = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      extractedFields,
      rawResponse: content,
    });
  } catch (error) {
    console.error("Parse response error:", error);
    return NextResponse.json(
      { error: "Failed to parse response", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildExtractionPrompt(
  userResponse: string,
  currentQuestion: string,
  collectedFields: Record<string, any>
): string {
  const alreadyCollected = Object.entries(collectedFields)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(", ");

  return `You are analyzing a user's response in a psychological interview to build a mirror agent.

Current Question: "${currentQuestion}"
User Response: "${userResponse}"

Already Collected Fields: ${alreadyCollected || "None"}

Extract relevant psychological information from the user's response. Return ONLY a JSON object with the following structure (include only the fields that are present in the response, leave others empty):

{
  "emotion": "primary emotion detected (e.g., sadness, anger, anxiety)",
  "trigger": "what triggered this emotion",
  "expectation": "what the user expected instead",
  "value": "core value that was violated",
  "thinking_pattern": "how the user typically thinks about this",
  "core_belief": "underlying belief about themselves or others",
  "sensitivity": "what makes them sensitive",
  "pain_point": "main source of pain",
  "relationship_pattern": "pattern in their relationships"
}

Be concise and extract only what's explicitly or clearly implied in the user's response. Return only the JSON object, no additional text.`;
}
