import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message, messageAnalysis, room } from "~/lib/db/schema";

// Message analysis logic
function analyzeMessage(text: string) {
  // Simple analysis logic - in real implementation, this would use AI/NLP
  const lowercaseText = text.toLowerCase();

  // Determine if message crosses the "net" (is positive/negative)
  const positiveWords = ["good", "great", "thanks", "awesome", "nice", "cool", "happy", "love"];
  const negativeWords = ["bad", "hate", "awful", "terrible", "suck", "stupid", "angry", "annoyed"];

  const hasPositive = positiveWords.some(word => lowercaseText.includes(word));
  const hasNegative = negativeWords.some(word => lowercaseText.includes(word));

  let isCrossNet = "No";
  let senderState = "Neutral";
  let receiverImpact = "Neutral";
  let evidence = "The message appears neutral.";
  let suggestion = "Continue the conversation naturally.";
  let risk = "Medium";

  if (hasPositive && !hasNegative) {
    isCrossNet = "Yes";
    senderState = "Positive";
    receiverImpact = "Positive";
    evidence = "The message contains positive language and sentiment.";
    suggestion = "Great communication! Keep up the positive tone.";
    risk = "Low";
  } else if (hasNegative && !hasPositive) {
    isCrossNet = "No";
    senderState = "Negative";
    receiverImpact = "Negative";
    evidence = "The message contains negative language that might be concerning.";
    suggestion = "Consider rephrasing with more positive language.";
    risk = "High";
  } else if (text.includes("?")) {
    isCrossNet = "Yes";
    senderState = "Curious";
    receiverImpact = "Engaging";
    evidence = "The message asks a question, encouraging interaction.";
    suggestion = "Questions are great for maintaining conversation flow.";
    risk = "Low";
  }

  return {
    isCrossNet,
    senderState,
    receiverImpact,
    evidence,
    suggestion,
    risk,
  };
}

function calculateScoreChange(analysis: any): number {
  // Tennis-style scoring logic
  if (analysis.isCrossNet === "Yes" && analysis.risk === "Low") {
    return 15; // Good shot over the net
  } else if (analysis.isCrossNet === "Yes" && analysis.risk === "Medium") {
    return 10; // Decent shot
  } else if (analysis.isCrossNet === "No" || analysis.risk === "High") {
    return -5; // Shot into the net or fault
  }
  return 0;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: roomId } = await params;
    const body = await request.json();

    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 },
      );
    }

    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if room exists
    const roomData = await db.select().from(room).where(eq(room.id, roomId)).limit(1);

    if (roomData.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 },
      );
    }

    // Analyze the message
    const analysis = analyzeMessage(text);
    const messageId = nanoid();
    const analysisId = nanoid();

    // Create the message first
    await db.insert(message).values({
      id: messageId,
      roomId,
      userId: session?.user?.id || null,
      userType: "You", // Assuming the sender is always "You"
      text: text.trim(),
      analysisId,
    });

    // Create message analysis after message
    await db.insert(messageAnalysis).values({
      id: analysisId,
      messageId,
      ...analysis,
    });

    // Calculate score change and update room
    const scoreChange = calculateScoreChange(analysis);
    const currentRoom = roomData[0];

    const newPlayer1Score = Math.max(0, currentRoom.player1Score + scoreChange);

    await db.update(room)
      .set({
        player1Score: newPlayer1Score,
        updatedAt: new Date(),
      })
      .where(eq(room.id, roomId));

    // Simulate friend's response after a delay (this would be real-time in production)
    setTimeout(async () => {
      const friendResponses = [
        "That's interesting!",
        "I see what you mean.",
        "Tell me more about that.",
        "That's cool!",
        "I understand.",
        "What do you think about this?",
      ];

      const friendText = friendResponses[Math.floor(Math.random() * friendResponses.length)];
      const friendAnalysis = analyzeMessage(friendText);
      const friendMessageId = nanoid();
      const friendAnalysisId = nanoid();

      try {
        // Create friend's message first
        await db.insert(message).values({
          id: friendMessageId,
          roomId,
          userId: null,
          userType: "Friend",
          text: friendText,
          analysisId: friendAnalysisId,
        });

        // Create friend's message analysis
        await db.insert(messageAnalysis).values({
          id: friendAnalysisId,
          messageId: friendMessageId,
          ...friendAnalysis,
        });

        // Update friend's score (player2)
        const friendScoreChange = calculateScoreChange(friendAnalysis);
        const updatedRoom = await db.select().from(room).where(eq(room.id, roomId)).limit(1);

        if (updatedRoom.length > 0) {
          const newPlayer2Score = Math.max(0, updatedRoom[0].player2Score + friendScoreChange);

          await db.update(room)
            .set({
              player2Score: newPlayer2Score,
              updatedAt: new Date(),
            })
            .where(eq(room.id, roomId));
        }
      } catch (error) {
        console.error("Error creating friend response:", error);
      }
    }, 1000);

    // Return the response
    return NextResponse.json({
      message: {
        id: messageId,
        user: "You",
        text: text.trim(),
        timestamp: Math.floor(Date.now() / 1000),
      },
      analysis: {
        isCrossNet: analysis.isCrossNet,
        senderState: analysis.senderState,
        receiverImpact: analysis.receiverImpact,
        evidence: analysis.evidence,
        suggestion: analysis.suggestion,
        risk: analysis.risk,
      },
      score: {
        player1Score: newPlayer1Score,
        player2Score: currentRoom.player2Score,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
