import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { env } from "~/config/server";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    const { collectedFields } = await request.json();

    if (!collectedFields) {
      return NextResponse.json(
        { error: "Missing collected fields" },
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

    // Determine which fields are missing
    const requiredFields = [
      "emotion",
      "trigger",
      "expectation",
      "value",
      "thinking_pattern",
      "core_belief",
      "sensitivity",
      "pain_point",
      "relationship_pattern",
    ];
    
    const missingFields = requiredFields.filter(field => !collectedFields[field]);

    if (missingFields.length === 0) {
      return NextResponse.json(
        { error: "All fields already collected" },
        { status: 400 }
      );
    }

    // Build prompt to generate next question
    const prompt = buildQuestionGenerationPrompt(collectedFields, missingFields);

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    // Extract question from response (it should be the main text)
    const question = content.trim();

    return NextResponse.json({
      question,
      questionId: nanoid(),
      missingFields,
      progress: Math.round(
        ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
      ),
    });
  } catch (error) {
    console.error("Next question error:", error);
    return NextResponse.json(
      { error: "Failed to generate next question", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildQuestionGenerationPrompt(
  collectedFields: Record<string, any>,
  missingFields: string[]
): string {
  const collectedSummary = Object.entries(collectedFields)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");

  const nextFieldToCollect = missingFields[0];
  const fieldDescriptions: Record<string, string> = {
    emotion: "the primary emotion they're experiencing",
    trigger: "what triggered or caused this emotion",
    expectation: "what they expected instead of what happened",
    value: "what core value or belief was violated",
    thinking_pattern: "how they typically think about similar situations",
    core_belief: "their underlying belief about themselves or others",
    sensitivity: "what makes them sensitive or reactive",
    pain_point: "their deepest source of pain or struggle",
    relationship_pattern: "patterns they notice in their relationships",
  };

  return `You are a compassionate psychological interviewer helping someone understand themselves deeply. Your role is to generate thoughtful, open-ended questions that help them explore their inner world.

Already Collected Information:
${collectedSummary || "None yet"}

Next Field to Explore: ${nextFieldToCollect}
(Focus on: ${fieldDescriptions[nextFieldToCollect] || "understanding this aspect"})

Generate a warm, empathetic, open-ended question that naturally flows from the conversation to help them explore the "${nextFieldToCollect}" aspect. The question should:
1. Be specific to what they've already shared
2. Be deeply exploratory and encourage self-reflection
3. Be warm and compassionate
4. Not be leading or suggest answers
5. Help them connect to their emotions and values

Return ONLY the question, nothing else.`;
}
