import { NextRequest, NextResponse } from "next/server";
import { db } from "~/lib/db";
import { interviewSession } from "~/lib/db/schema";
import { auth } from "~/lib/auth/server";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  try {
    // Get session using better-auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Create interview session
    const sessionId = nanoid();
    const firstQuestion = "Let's start this journey together. What emotion or feeling has been on your mind lately? This could be sadness, anger, anxiety, or any emotion you'd like to explore.";

    await db.insert(interviewSession).values({
      id: sessionId,
      userId,
      currentQuestion: firstQuestion,
      currentQuestionId: nanoid(),
      conversationHistory: JSON.stringify([]),
      status: "in_progress",
    });

    return NextResponse.json({
      sessionId,
      question: firstQuestion,
      questionId: nanoid(),
      progress: 0,
    });
  } catch (error) {
    console.error("Interview start error:", error);
    return NextResponse.json(
      { error: "Failed to start interview" },
      { status: 500 }
    );
  }
}
