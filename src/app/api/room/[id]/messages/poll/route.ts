import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message, messageAnalysis, room } from "~/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roomId } = await params;
  const url = new URL(request.url);
  const lastMessageId = url.searchParams.get("lastMessageId");

  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Authentication required",
        message: "You must be logged in to access messages",
      },
      { status: 401 },
    );
  }

  try {
    // Get new messages after lastMessageId
    // If lastMessageId is provided, we need to fetch all messages and filter
    // since nanoid strings can't be compared directly with gt()
    const whereCondition = eq(message.roomId, roomId);

    // First, get all messages for the room with their analyses
    const messagesQuery = db
      .select({
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        username: message.username,
        userType: message.userType,
        content: message.content,
        createdAt: message.createdAt,
        analysis: {
          id: messageAnalysis.id,
          isCrossNet: messageAnalysis.isCrossNet,
          senderState: messageAnalysis.senderState,
          receiverImpact: messageAnalysis.receiverImpact,
          evidence: messageAnalysis.evidence,
          suggestion: messageAnalysis.suggestion,
          risk: messageAnalysis.risk,
        },
      })
      .from(message)
      .leftJoin(messageAnalysis, eq(message.analysisId, messageAnalysis.id))
      .where(whereCondition)
      .orderBy(message.createdAt)
      .limit(100); // Get more messages for filtering

    const allMessages = await messagesQuery;

    let filteredMessages = allMessages;

    // If lastMessageId is provided, filter to only return newer messages
    if (lastMessageId) {
      const lastMessageIndex = allMessages.findIndex(msg => msg.id === lastMessageId);
      if (lastMessageIndex >= 0) {
        // Return messages after the lastMessageId
        filteredMessages = allMessages.slice(lastMessageIndex + 1);
      }
    }

    // Transform messages to match expected format
    const transformedMessages = filteredMessages.map(msg => ({
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.userId,
      username: msg.username,
      content: msg.content,
      userType: msg.userType,
      createdAt: msg.createdAt.toISOString(),
      analysis: (msg.analysis && msg.analysis.id)
        ? {
            isCrossNet: msg.analysis.isCrossNet,
            senderState: msg.analysis.senderState,
            receiverImpact: msg.analysis.receiverImpact,
            evidence: msg.analysis.evidence,
            suggestion: msg.analysis.suggestion,
            risk: msg.analysis.risk,
          }
        : undefined,
    }));

    // 获取最新的房间分数信息
    const currentRoom = await db.select().from(room).where(eq(room.id, roomId)).limit(1);
    const roomScores = currentRoom.length > 0
      ? {
          player1Score: currentRoom[0].player1Score,
          player2Score: currentRoom[0].player2Score,
          createdById: currentRoom[0].createdById,
        }
      : null;

    return NextResponse.json({
      messages: transformedMessages,
      scores: roomScores,
      currentUserId: session.user.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
