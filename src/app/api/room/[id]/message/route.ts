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

    // Get current session - required for sending messages
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "You must be logged in to send messages",
        },
        { status: 401 },
      );
    }

    // Check if room exists
    const roomData = await db.select().from(room).where(eq(room.id, roomId)).limit(1);

    if (roomData.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 },
      );
    }

    // Generate message ID
    const messageId = nanoid();

    // Get user information (user is guaranteed to be authenticated at this point)
    const currentUserId = session.user.id;
    const currentUsername = session.user.name || session.user.email || "User";
    const userIdentifier = currentUserId; // Use actual user ID for frontend identification

    let analysis; let analysisId = null; let scoreChange = 0;

    // Always create the message first
    await db.insert(message).values({
      id: messageId,
      roomId,
      userId: currentUserId, // null for anonymous users
      username: currentUsername,
      userType: userIdentifier, // Use identifier for frontend identification
      content: text.trim(),
      analysisId: null, // Will be updated if analysis succeeds
    });

    try {
      // Try to analyze the message
      analysis = analyzeMessage(text);
      analysisId = nanoid();
      scoreChange = calculateScoreChange(analysis);

      // Create message analysis after message
      await db.insert(messageAnalysis).values({
        id: analysisId,
        messageId,
        ...analysis,
      });

      // Update message with analysis ID
      await db.update(message)
        .set({ analysisId })
        .where(eq(message.id, messageId));
    } catch (analysisError) {
      console.error("Message analysis failed, but message still created:", analysisError);
      // Keep analysisId as null if analysis fails
    }

    // Update room score only if analysis succeeded
    const currentRoom = roomData[0];
    let newPlayer1Score = currentRoom.player1Score;

    if (scoreChange !== 0) {
      newPlayer1Score = Math.max(0, currentRoom.player1Score + scoreChange);
      await db.update(room)
        .set({
          player1Score: newPlayer1Score,
          updatedAt: new Date(),
        })
        .where(eq(room.id, roomId));
    }

    // Messages are now retrieved via polling, no need for WebSocket broadcast

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
      const friendMessageId = nanoid();
      const friendUserId = null; // null to avoid foreign key constraint
      const friendUserIdentifier = `ai_friend_${roomId}`; // Consistent friend ID per room for frontend
      const friendUsername = "AI Friend";

      let friendAnalysis; let friendAnalysisId = null; let friendScoreChange = 0;

      try {
        // Try to analyze friend's message
        friendAnalysis = analyzeMessage(friendText);
        friendAnalysisId = nanoid();
        friendScoreChange = calculateScoreChange(friendAnalysis);

        // Create friend's message analysis
        await db.insert(messageAnalysis).values({
          id: friendAnalysisId,
          messageId: friendMessageId,
          ...friendAnalysis,
        });
      } catch (friendAnalysisError) {
        console.error("Friend message analysis failed:", friendAnalysisError);
      }

      try {
        // Always create friend's message first
        await db.insert(message).values({
          id: friendMessageId,
          roomId,
          userId: friendUserId, // null to avoid foreign key constraint
          username: friendUsername,
          userType: friendUserIdentifier, // Use identifier for frontend identification
          content: friendText,
          analysisId: null, // Will be updated if analysis succeeds
        });

        // Update message with analysis ID if analysis succeeded
        if (friendAnalysisId) {
          await db.update(message)
            .set({ analysisId: friendAnalysisId })
            .where(eq(message.id, friendMessageId));
        }

        // Update friend's score (player2) only if analysis succeeded
        const updatedRoom = await db.select().from(room).where(eq(room.id, roomId)).limit(1);

        if (updatedRoom.length > 0) {
          let newPlayer2Score = updatedRoom[0].player2Score;

          if (friendScoreChange !== 0) {
            newPlayer2Score = Math.max(0, updatedRoom[0].player2Score + friendScoreChange);
            await db.update(room)
              .set({
                player2Score: newPlayer2Score,
                updatedAt: new Date(),
              })
              .where(eq(room.id, roomId));
          }

          // Friend's message will be retrieved via polling, no need for WebSocket broadcast
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
      analysis: analysis
        ? {
            isCrossNet: analysis.isCrossNet,
            senderState: analysis.senderState,
            receiverImpact: analysis.receiverImpact,
            evidence: analysis.evidence,
            suggestion: analysis.suggestion,
            risk: analysis.risk,
          }
        : null,
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
