import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/db";
import { agent, agentMessage } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth/server";
import { OpenAI } from "openai";
import { env } from "~/config/server";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { agentId } = await params;
    const { userMessage, conversationHistory } = await request.json();

    if (!userMessage || !agentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get agent
    const agentData = await db.query.agent.findFirst({
      where: eq(agent.id, agentId),
    });

    if (!agentData) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Prepare messages for OpenAI
    const client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.OPENAI_BASE_URL,
    });

    const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      {
        role: "system",
        content: agentData.systemPrompt,
      },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Get response from OpenAI
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      max_tokens: 1024,
      messages,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0].message.content;

    if (!assistantMessage) {
      throw new Error("No response from OpenAI");
    }

    // Save user message
    await db.insert(agentMessage).values({
      id: nanoid(),
      agentId,
      userId: session.user.id,
      role: "user",
      content: userMessage,
    });

    // Save assistant message
    await db.insert(agentMessage).values({
      id: nanoid(),
      agentId,
      userId: session.user.id,
      role: "assistant",
      content: assistantMessage,
    });

    return NextResponse.json({
      response: assistantMessage,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
