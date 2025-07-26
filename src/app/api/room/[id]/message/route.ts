import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message, messageAnalysis, room } from "~/lib/db/schema";
import { analyzeMessageWithLLM } from "~/lib/llm/client";

// Get conversation history for context
async function getConversationHistory(roomId: string, limit: number = 10) {
  const recentMessages = await db
    .select({
      username: message.username,
      content: message.content,
      createdAt: message.createdAt,
    })
    .from(message)
    .where(eq(message.roomId, roomId))
    .orderBy(message.createdAt)
    .limit(limit);

  return recentMessages.map(msg => ({
    sender: msg.username,
    message: msg.content,
    timestamp: msg.createdAt.toISOString(),
  }));
}

function calculateScoreChange(analysis: any): number {
  // Tennis-style scoring logic
  // 越网时扣分（球过网了，对手得分），没越网时加分（球撞网，自己得分）
  if (analysis.isCrossNet === "是") {
    return -1; // 消息越网，扣一分
  } else if (analysis.isCrossNet === "否") {
    return 1; // 消息没有越网，加一分
  }
  return 0; // 其他情况不变分数
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

    let analysis;
    let analysisId = null;
    let scoreChange = 0;

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
      // Get conversation history for context
      const conversationHistory = await getConversationHistory(roomId, 10);

      // Try to analyze the message with LLM
      analysis = await analyzeMessageWithLLM({
        conversationHistory,
        latestMessage: {
          sender: currentUsername,
          receiver: "对方", // Generic receiver since we don't track specific users
          content: text.trim(),
        },
        relationshipContext: "聊天室对话",
      });

      analysisId = nanoid();
      scoreChange = calculateScoreChange(analysis);

      // Create message analysis after message
      await db.insert(messageAnalysis).values({
        id: analysisId,
        messageId,
        isCrossNet: analysis.isCrossNet,
        senderState: analysis.senderState,
        receiverImpact: analysis.receiverImpact,
        evidence: analysis.evidence,
        suggestion: analysis.suggestion,
        risk: analysis.risk,
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
    let newPlayer2Score = currentRoom.player2Score;

    if (scoreChange !== 0) {
      // Determine if current user is player1 (room creator) or player2
      const isPlayer1 = currentUserId === currentRoom.createdById;
      if (isPlayer1) {
        // Current user is room creator (Player 1)
        newPlayer1Score = Math.max(0, currentRoom.player1Score + scoreChange);
      } else {
        // Current user is not room creator (Player 2)
        newPlayer2Score = Math.max(0, currentRoom.player2Score + scoreChange);
      }
      await db.update(room)
        .set({
          player1Score: newPlayer1Score,
          player2Score: newPlayer2Score,
          updatedAt: new Date(),
        })
        .where(eq(room.id, roomId));
    }

    // Messages are now retrieved via polling, no need for WebSocket broadcast
    // Note: This is a user-to-user chat system, no AI auto-replies

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
        player2Score: newPlayer2Score,
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
