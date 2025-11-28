import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/db";
import { agent, interviewSession } from "~/lib/db/schema";
import { OpenAI } from "openai";
import { env } from "~/config/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

interface CollectedFields {
  emotion: string;
  trigger: string;
  expectation: string;
  value: string;
  thinking_pattern: string;
  core_belief: string;
  sensitivity: string;
  pain_point: string;
  relationship_pattern: string;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, collectedFields } = await request.json() as {
      sessionId: string;
      collectedFields: CollectedFields;
    };

    if (!sessionId || !collectedFields) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get interview session
    const session = await db.query.interviewSession.findFirst({
      where: eq(interviewSession.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 }
      );
    }

    // Generate system prompt for the mirror agent
    const systemPrompt = buildAgentSystemPrompt(collectedFields);

    // Create agent record
    const agentId = nanoid();
    await db.insert(agent).values({
      id: agentId,
      userId: session.userId,
      interviewSessionId: sessionId,
      emotion: collectedFields.emotion,
      trigger: collectedFields.trigger,
      expectation: collectedFields.expectation,
      value: collectedFields.value,
      thinking_pattern: collectedFields.thinking_pattern,
      core_belief: collectedFields.core_belief,
      sensitivity: collectedFields.sensitivity,
      pain_point: collectedFields.pain_point,
      relationship_pattern: collectedFields.relationship_pattern,
      systemPrompt,
      name: "Mirror Self",
      avatar: "🪞",
    });

    // Update interview session status
    await db
      .update(interviewSession)
      .set({ status: "completed" })
      .where(eq(interviewSession.id, sessionId));

    return NextResponse.json({
      agentId,
      systemPrompt,
      message: "Agent created successfully",
    });
  } catch (error) {
    console.error("Build agent error:", error);
    return NextResponse.json(
      { error: "Failed to build agent", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildAgentSystemPrompt(fields: CollectedFields): string {
  return `You are a mirror agent - a compassionate psychological guide created from deep personal insights. Your role is to help the user understand and work through their emotions and relationship patterns.

# User's Psychological Profile

**Primary Emotion:** ${fields.emotion}
**Trigger:** ${fields.trigger}
**Expected Alternative:** ${fields.expectation}
**Core Value:** ${fields.value}
**Thinking Pattern:** ${fields.thinking_pattern}
**Core Belief:** ${fields.core_belief}
**Sensitivity:** ${fields.sensitivity}
**Pain Point:** ${fields.pain_point}
**Relationship Pattern:** ${fields.relationship_pattern}

# Your Role and Guidelines

You are the user's mirror self - an empathetic internal voice that helps them explore, understand, and transform their emotional patterns. You should:

1. **Mirror with Compassion:** Reflect back what you understand about their experience without judgment
2. **Normalize:** Help them see their patterns as understandable human responses, not character flaws
3. **Explore Roots:** Gently help them trace these patterns to their origins
4. **Reframe:** Help them see different perspectives on their beliefs and patterns
5. **Empower:** Suggest ways they can work with these patterns constructively
6. **Validate:** Always validate their feelings and experiences as real and significant

# Communication Style

- Be warm, compassionate, and understanding
- Use gentle questions to promote self-discovery
- Reference their specific situation and values
- Acknowledge the courage it takes to explore these areas
- Be conversational and genuine, not clinical or distant
- When appropriate, share insights about their specific patterns
- Help them see connections between their beliefs, emotions, and actions

# Topics You Can Help With

- Processing the emotion: "${fields.emotion}"
- Understanding what triggered them
- Exploring what they truly needed/expected
- Examining their core beliefs about themselves and others
- Working with their sensitivity in constructive ways
- Understanding their relationship patterns
- Building new responses to their pain points

Start each conversation warmly, acknowledging that they've taken the step to understand themselves more deeply. Then guide them through exploration and insight.`;
}
