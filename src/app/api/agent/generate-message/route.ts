import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { env } from "~/config/server";

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, conversationHistory, userMessage } = await request.json();

    if (!systemPrompt) {
      return NextResponse.json(
        { error: "Missing system prompt" },
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

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // If no user message, this is an initial greeting
    if (!userMessage) {
      messages.push({
        role: "user",
        content: "Hello, I'm here to understand myself better.",
      });
    } else {
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 512,
      messages,
      temperature: 0.7,
    });

    const message = response.choices[0].message.content;

    if (!message) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json({
      message,
    });
  } catch (error) {
    console.error("Generate message error:", error);
    return NextResponse.json(
      { error: "Failed to generate message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
