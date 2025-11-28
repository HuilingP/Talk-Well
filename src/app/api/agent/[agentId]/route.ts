import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/db";
import { agent, agentMessage } from "~/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/lib/auth/server";

export async function GET(
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

    const agentData = await db.query.agent.findFirst({
      where: eq(agent.id, agentId),
    });

    if (!agentData) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Get message history
    const messages = await db.query.agentMessage.findMany({
      where: eq(agentMessage.agentId, agentId),
    });

    return NextResponse.json({
      agent: {
        id: agentData.id,
        name: agentData.name,
        avatar: agentData.avatar,
        systemPrompt: agentData.systemPrompt,
      },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.createdAt.getTime(),
      })),
    });
  } catch (error) {
    console.error("Get agent error:", error);
    return NextResponse.json(
      { error: "Failed to get agent" },
      { status: 500 }
    );
  }
}
